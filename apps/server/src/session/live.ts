import { join } from "node:path";
import { SECOND_VOICE_DETAIL, overlapHeuristic } from "../integrity/overlap";
import type { SttProvider, TtsContext, TtsProvider } from "../providers/speech";
import { WavRecorder } from "./recorder";
import { newId, type Session, type SpokenTurn } from "./session";
import { createTurnState, decideTurn, type TurnState } from "./turns";

const FILLERS = new Set(["um", "uh", "like", "so", "yeah", "okay", "ok", "mm", "hmm", "ah", "er"]);

export type LiveSink = {
  json: (msg: { type: string; questionId?: string; sampleRate?: number; clip?: string }) => void;
  pcm: (pcm: Uint8Array) => void;
};

/**
 * Connects Scribe, Flash, our turn rules, and the wav recorders.
 * Text-mode sessions never construct this.
 */
export class LiveVoice {
  private turn: TurnState = createTurnState();
  private stream: { write(frame: Uint8Array): void; close(): Promise<void> } | null = null;
  private opened = false;
  private closed = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private finishing = false;
  private segId = "";
  private segStart = 0;
  private published = "";
  private lastPartialAt = 0;
  private vadSpeaking = false;
  private veritySpeaking = false;
  private overlapSent = false;
  private prepared: TtsContext | null = null;
  private speakingId: string | null = null;
  private candidateRec: WavRecorder;
  private verityRec: WavRecorder;
  private unsub: (() => void) | null = null;
  private tail: Promise<void> = Promise.resolve();

  constructor(
    private readonly session: Session,
    private readonly stt: SttProvider,
    private readonly tts: TtsProvider,
    private sink: LiveSink,
  ) {
    const dir = join(process.cwd(), "data", "audio", session.id);
    this.candidateRec = new WavRecorder(join(dir, "candidate.wav"));
    this.verityRec = new WavRecorder(join(dir, "verity.wav"));
  }

  attach(sink: LiveSink) {
    this.sink = sink;
  }

  async open() {
    if (this.opened) return;
    this.opened = true;
    this.unsub = this.session.log.subscribe(this.session.id, (e) => {
      if (e.type === "QUESTION_COMMITTED" && !this.session.state.textMode) {
        const { id, text } = e.payload;
        setImmediate(() => void this.speak(id, text));
      }
      if (e.type === "SESSION_ENDED") setImmediate(() => void this.close());
    });
    const terms = Object.values(this.session.state.cases)
      .flatMap((c) => c.technologies)
      .filter((t) => t.length > 0 && t.length <= 20)
      .slice(0, 50);
    this.stream = await this.stt.open(
      {
        onPartial: (text) => this.hear(text, Date.now()),
        onFinal: (text) => this.hear(text, Date.now()),
        onError: (err) => console.error(JSON.stringify({ at: "stt", message: err.message })),
      },
      { keyterms: terms },
    );
    this.timer = setInterval(() => this.pump(Date.now()), 100);
    this.timer.unref?.();
  }

  write(pcm: Uint8Array) {
    if (this.closed || !pcm.byteLength) return;
    this.candidateRec.write(pcm);
    this.stream?.write(pcm);
  }

  vad(speaking: boolean) {
    this.vadSpeaking = speaking;
    if (!speaking) this.overlapSent = false;
    const idle = this.lastPartialAt ? Date.now() - this.lastPartialAt : 0;
    if (
      !this.overlapSent &&
      overlapHeuristic({ candidateTranscriptIdleMs: idle, vadSpeaking: speaking, veritySpeaking: this.veritySpeaking })
    ) {
      this.overlapSent = true;
      const q = this.session.state.questionOrder.at(-1);
      void this.session.emit({
        type: "OBSERVATION",
        payload: {
          id: newId("obs"),
          kind: "SECOND_VOICE_POSSIBLE",
          startMs: this.session.now(),
          detail: SECOND_VOICE_DETAIL,
          duringQuestionId: q,
        },
      });
    }
    if (speaking && this.veritySpeaking && contentWords(this.turn.text).length >= 3) void this.yieldToCandidate();
  }

  /** A partial (or the same text again). Tests pass `nowMs` so they do not wait on the clock. */
  hear(text: string, nowMs: number) {
    if (this.closed || this.session.state.textMode) return;
    const spoken = this.currentQuestion();
    if (spoken && isEcho(text, spoken)) return;
    if (text !== this.turn.text) this.lastPartialAt = nowMs;
    const decision = decideTurn(this.turn, text, nowMs);
    this.turn = decision.state;
    if (text && this.published !== text) {
      this.published = text;
      const turn = this.capture();
      void this.session.audioPartial({ id: turn.segmentIds[0]!, text: turn.text, startMs: turn.startMs, endMs: turn.endMs });
    }
    this.tail = this.apply(decision.events);
    if (this.vadSpeaking && this.veritySpeaking && contentWords(text).length >= 3) void this.yieldToCandidate();
  }

  settled() {
    return this.tail.then(() => this.session.idle());
  }

  pump(nowMs: number) {
    if (!this.turn.text) return;
    this.hear(this.turn.text, nowMs);
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.unsub?.();
    this.prepared?.close();
    this.prepared = null;
    await this.stream?.close();
    this.candidateRec.close();
    this.verityRec.close();
  }

  private async apply(events: Array<"early" | "resumed" | "final">) {
    if (!events.length) return;
    for (const event of events) {
      const turn = this.capture();
      if (event === "resumed") {
        this.prepared?.close();
        this.prepared = null;
        await this.session.resumeTurn(turn);
      }
      if (event === "early") {
        void this.preopen();
        await this.session.earlyTurn(turn);
      }
      if (event === "final") {
        if (this.finishing) return;
        this.finishing = true;
        this.turn = createTurnState();
        this.published = "";
        this.sink.json({ type: "ACK", clip: "mm-hm" });
        await this.session.spokenAnswer(turn);
        this.finishing = false;
        return;
        this.segId = "";
      }
    }
  }

  private capture(): SpokenTurn {
    if (!this.segId) {
      this.segId = newId("seg");
      this.segStart = this.session.now();
    }
    return {
      segmentIds: [this.segId],
      text: this.turn.text,
      startMs: this.segStart,
      endMs: Math.max(this.segStart, this.session.now()),
    };
  }

  private async preopen() {
    if (this.prepared || this.closed) return;
    this.prepared = await this.tts.open("speculative", (pcm) => this.onPcm(pcm), () => this.onDone());
  }

  private async speak(questionId: string, text: string) {
    if (this.closed || this.session.state.textMode) return;
    this.speakingId = questionId;
    const ctx = this.prepared ?? (await this.tts.open(questionId, (pcm) => this.onPcm(pcm), () => this.onDone()));
    this.prepared = null;
    this.veritySpeaking = true;
    this.sink.json({ type: "TTS_BEGIN", questionId, sampleRate: this.tts.sampleRate });
    await this.session.emit({ type: "VERITY_AUDIO_STARTED", payload: { questionId } });
    await this.markVoice("SPEAK", "question committed");
    ctx.speak(text);
  }

  private onPcm(pcm: Uint8Array) {
    if (!this.speakingId || !pcm.byteLength) return;
    this.verityRec.write(pcm);
    this.sink.pcm(pcm);
  }

  private onDone() {
    const questionId = this.speakingId;
    this.veritySpeaking = false;
    this.speakingId = null;
    if (!questionId) return;
    this.sink.json({ type: "TTS_END", questionId });
    void this.session.emit({ type: "VERITY_AUDIO_ENDED", payload: { questionId } });
    void this.markVoice("LISTEN", "question finished");
  }

  private async yieldToCandidate() {
    if (!this.veritySpeaking || !this.speakingId) return;
    const questionId = this.speakingId;
    this.veritySpeaking = false;
    this.speakingId = null;
    this.prepared?.close();
    this.prepared = null;
    this.sink.json({ type: "YIELD", questionId });
    await this.session.emit({ type: "QUESTION_INTERRUPTED", payload: { questionId, atChar: 0 } });
    await this.markVoice("YIELD", "candidate spoke over the question");
  }

  private async markVoice(to: "LISTEN" | "ACK" | "SPEAK" | "YIELD", reason: string) {
    const from = this.session.state.voiceState;
    if (from === to) return;
    await this.session.emit({ type: "VOICE_STATE", payload: { from, to, reason } });
  }

  private currentQuestion() {
    const id = this.session.state.questionOrder.at(-1);
    return id ? this.session.state.questions[id]?.text ?? "" : "";
  }
}

function contentWords(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter((w) => w && !FILLERS.has(w));
}

function tokenSet(text: string) {
  return new Set(text.toLowerCase().match(/[a-z0-9']+/g) ?? []);
}

function isEcho(partial: string, spoken: string) {
  const a = tokenSet(spoken);
  const b = tokenSet(partial);
  if (!a.size || !b.size) return false;
  let hit = 0;
  for (const t of b) if (a.has(t)) hit += 1;
  return hit / (a.size + b.size - hit) >= 0.8;
}
