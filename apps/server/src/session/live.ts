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
  /** Question the overlap note was last considered for. One note per question. */
  private overlapFor = "";
  private prepared: TtsContext | null = null;
  private active: TtsContext | null = null;
  private speakingId: string | null = null;
  private speakToken = 0;
  private finishSpeak: (() => void) | null = null;
  private speechChain: Promise<void> = Promise.resolve();
  private speechQueue: { id: string; text: string }[] = [];
  /** Everything Verity has been asked to say, so the mic can ignore that echo. */
  private spokenAloud = "";
  /** Candidate speech already closed into a turn. Later cumulative transcripts must not file it again. */
  private answered = "";
  /** PCM bytes since the last Scribe commit. A commit under 0.3s makes Scribe drop the utterance. */
  private pcmSinceCommit = 0;
  private candidateRec: WavRecorder;
  private verityRec: WavRecorder;
  /** First candidate frame is padded so WAV sample 0 is session time 0. */
  private aligned = false;
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
        this.enqueueSpeech(id, text);
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
    this.alignClock();
    this.candidateRec.write(pcm);
    this.pcmSinceCommit += pcm.byteLength;
    this.stream?.write(pcm);
  }

  /** Silence from t=0 up to the first frame, so a receipt clip time is a byte offset in candidate.wav. */
  private alignClock() {
    if (this.aligned) return;
    this.aligned = true;
    const capMs = (this.session.state.meta?.durationSec ?? 900) * 1000;
    const at = Math.min(Math.max(0, this.session.now()), capMs);
    const samples = Math.round((at / 1000) * this.candidateRec.sampleRate);
    if (samples > 0) this.candidateRec.write(new Uint8Array(samples * 2));
  }

  vad(speaking: boolean) {
    this.vadSpeaking = speaking;
    const q = this.session.state.questionOrder.at(-1) ?? "";
    if (q !== this.overlapFor) {
      this.overlapFor = q;
      this.overlapSent = false;
    }
    const idle = this.lastPartialAt ? Date.now() - this.lastPartialAt : 0;
    if (
      !this.overlapSent &&
      overlapHeuristic({ candidateTranscriptIdleMs: idle, vadSpeaking: speaking, veritySpeaking: this.veritySpeaking })
    ) {
      this.overlapSent = true;
      void this.session.emit({
        type: "OBSERVATION",
        payload: {
          id: newId("obs"),
          kind: "SECOND_VOICE_POSSIBLE",
          startMs: this.session.now(),
          detail: SECOND_VOICE_DETAIL,
          duringQuestionId: q || undefined,
        },
      });
    }
    if (speaking && this.veritySpeaking && contentWords(this.turn.text).length >= 3) void this.yieldToCandidate();
  }

  /** A partial (or the same text again). Tests pass `nowMs` so they do not wait on the clock. */
  hear(text: string, nowMs: number) {
    if (this.closed || this.session.state.textMode) return;
    const candidate = freshWords(candidateUtterance(text, this.spokenAloud), this.answered);
    if (!candidate) return;
    text = candidate;
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

  /** Resolves once every queued utterance has finished speaking. */
  whenSpoken() {
    return this.speechChain;
  }

  pump(nowMs: number) {
    if (!this.turn.text) return;
    // Mic still open: Scribe often pauses on "like" / "so" while the person is talking.
    // Do not start the next question until the mic has gone quiet, unless the text has been stuck for a long time.
    const stalled = this.turn.changedAtMs === null ? 0 : nowMs - this.turn.changedAtMs;
    if (this.vadSpeaking && stalled < 8_000) return;
    this.hear(this.turn.text, nowMs);
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.speechQueue.length = 0;
    this.speakToken += 1;
    this.active?.close();
    this.active = null;
    this.completeSpeak();
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
        this.answered = this.answered ? `${this.answered} ${turn.text}` : turn.text;
        this.turn = createTurnState();
        this.published = "";
        this.segId = "";
        this.commitStt();
        this.sink.json({ type: "ACK", clip: "mm-hm" });
        await this.session.spokenAnswer(turn);
        this.finishing = false;
        return;
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
    this.prepared = await this.tts.open("speculative", () => {}, () => {});
  }

  /** One utterance at a time. The greeting must finish before the first question starts. */
  private enqueueSpeech(id: string, text: string) {
    this.speechQueue.push({ id, text });
    this.speechChain = this.speechChain.then(() => this.pumpSpeech());
  }

  private async pumpSpeech() {
    const next = this.speechQueue.shift();
    if (!next || this.closed) return;
    await this.speak(next.id, next.text);
    if (this.speechQueue.length) await this.pumpSpeech();
  }

  private speak(questionId: string, text: string): Promise<void> {
    if (this.closed || this.session.state.textMode) return Promise.resolve();
    return new Promise((resolve) => {
      this.finishSpeak = resolve;
      void this.beginSpeak(questionId, text).catch(() => this.completeSpeak());
    });
  }

  private async beginSpeak(questionId: string, text: string) {
    const token = ++this.speakToken;
    this.speakingId = questionId;
    this.spokenAloud = `${this.spokenAloud} ${text}`.trim();
    this.prepared?.close();
    this.prepared = null;
    const ctx = await this.tts.open(
      questionId,
      (pcm) => this.onPcm(token, pcm),
      () => this.onDone(token),
    );
    if (token !== this.speakToken || this.closed) {
      ctx.close();
      this.completeSpeak();
      return;
    }
    this.active = ctx;
    this.veritySpeaking = true;
    this.sink.json({ type: "TTS_BEGIN", questionId, sampleRate: this.tts.sampleRate });
    await this.session.emit({ type: "VERITY_AUDIO_STARTED", payload: { questionId } });
    await this.markVoice("SPEAK", "question committed");
    ctx.speak(text);
  }

  private onPcm(token: number, pcm: Uint8Array) {
    if (token !== this.speakToken || !this.speakingId || !pcm.byteLength) return;
    this.verityRec.write(pcm);
    this.sink.pcm(pcm);
  }

  private onDone(token: number) {
    if (token !== this.speakToken) return;
    const questionId = this.speakingId;
    this.veritySpeaking = false;
    this.speakingId = null;
    this.active = null;
    if (questionId) {
      this.sink.json({ type: "TTS_END", questionId });
      void this.session.emit({ type: "VERITY_AUDIO_ENDED", payload: { questionId } });
      void this.markVoice("LISTEN", "question finished");
      this.commitStt();
    }
    this.completeSpeak();
  }

  private async yieldToCandidate() {
    if (!this.veritySpeaking || !this.speakingId) return;
    const questionId = this.speakingId;
    this.speechQueue.length = 0;
    this.speakToken += 1;
    this.active?.close();
    this.active = null;
    this.prepared?.close();
    this.prepared = null;
    this.veritySpeaking = false;
    this.speakingId = null;
    this.sink.json({ type: "YIELD", questionId });
    await this.session.emit({ type: "QUESTION_INTERRUPTED", payload: { questionId, atChar: 0 } });
    await this.markVoice("YIELD", "candidate spoke over the question");
    this.completeSpeak();
  }

  /** Scribe rejects a commit with less than 0.3s of audio and can stall the transcript after that. */
  private commitStt() {
    const minBytes = 16_000 * 2 * 0.3;
    if (this.pcmSinceCommit < minBytes) return;
    this.pcmSinceCommit = 0;
    this.stream?.commit();
  }

  private completeSpeak() {
    const done = this.finishSpeak;
    this.finishSpeak = null;
    done?.();
  }

  private async markVoice(to: "LISTEN" | "ACK" | "SPEAK" | "YIELD", reason: string) {
    const from = this.session.state.voiceState;
    if (from === to) return;
    await this.session.emit({ type: "VOICE_STATE", payload: { from, to, reason } });
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

/**
 * Drop a transcript that is only Verity's own voice.
 * A partial that starts with that echo and then continues in the candidate's words
 * keeps the candidate's words.
 */
/** Words Scribe repeats from an answer that was already closed. */
export function freshWords(partial: string, already: string): string {
  const answered = normalizeSpace(already);
  const incoming = partial.trim();
  if (!incoming) return "";
  if (!answered) return incoming;
  const words = incoming.split(/\s+/);
  let acc = "";
  let index = 0;
  for (; index < words.length; index += 1) {
    const next = normalizeSpace(acc ? `${acc} ${words[index]}` : words[index]!);
    if (!answered.startsWith(next)) break;
    acc = next;
    if (acc === answered) {
      index += 1;
      break;
    }
  }
  if (acc !== answered) return incoming;
  return words.slice(index).join(" ").trim();
}

function normalizeSpace(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function candidateUtterance(partial: string, spoken: string): string {
  const said = tokenSet(spoken);
  const words = partial.split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  if (!said.size) return partial.trim();
  let start = 0;
  while (start < words.length) {
    const token = words[start]!.toLowerCase().replace(/[^a-z0-9']/g, "");
    if (token && !said.has(token) && !FILLERS.has(token)) break;
    start += 1;
  }
  const rest = words.slice(start).join(" ").trim();
  const novel = contentWords(rest).filter((word) => !said.has(word));
  return novel.length ? rest : "";
}
