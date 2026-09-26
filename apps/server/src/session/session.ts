import { randomUUID } from "node:crypto";
import { emptyState, reduce, type NewEvent, type SessionState, type VerityEvent } from "@verity/contracts";
import type { EventLog } from "../log/event-log";

export const newId = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

/** Hooks the case engine attaches to (P1). The session itself only owns the clock and the log. */
export interface SpokenTurn {
  segmentIds: string[];
  text: string;
  startMs: number;
  endMs: number;
}

export interface SessionBrain {
  onStart(s: Session): Promise<void>;
  onCandidateTurn(s: Session, turn: SpokenTurn): Promise<void>;
  /** Mid-answer text. Provisional belief only; no receipt. */
  onPartial?(s: Session, text: string): Promise<void>;
  /** Early end-of-turn. May draft the next question; must not speak it. */
  onEarly?(s: Session, text: string): Promise<void>;
}

export class Session {
  state: SessionState = emptyState();
  private t0: number | null = null;
  private busy: Promise<unknown> = Promise.resolve();

  constructor(
    readonly id: string,
    readonly log: EventLog,
    private brain: SessionBrain | null,
  ) {}

  static async load(id: string, log: EventLog, brain: SessionBrain | null) {
    const s = new Session(id, log, brain);
    for (const e of await log.read(id)) s.apply(e);
    if (s.state.started) s.t0 = Date.now() - s.state.atMs;
    return s;
  }

  /** Session clock: ms since START (0 before START). */
  now(): number {
    return this.t0 === null ? 0 : Date.now() - this.t0;
  }

  async emit(e: Omit<NewEvent, "atMs"> & { atMs?: number }): Promise<VerityEvent> {
    const ev = await this.log.append(this.id, { ...e, atMs: e.atMs ?? this.now() } as NewEvent);
    this.apply(ev);
    return ev;
  }

  private apply(e: VerityEvent) {
    this.state = reduce(this.state, e);
  }

  /** Serializes engine work so turns are processed in order. */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.busy.catch(() => undefined).then(fn);
    this.busy = next;
    return next;
  }

  start(textMode: boolean) {
    return this.enqueue(async () => {
      if (this.state.started) return;
      this.t0 = Date.now();
      await this.emit({ type: "SESSION_STARTED", payload: { textMode } });
      await this.brain?.onStart(this);
    });
  }

  textAnswer(text: string) {
    return this.enqueue(async () => {
      if (!this.state.started || this.state.ended) return;
      const t = this.now();
      const startMs = Math.max(0, t - Math.max(800, text.split(/\s+/).length * 350));
      const seg = { id: newId("seg"), speaker: "candidate" as const, text, startMs, endMs: t, final: true };
      await this.emit({ type: "SEGMENT_FINAL", payload: seg });
      const turn = { segmentIds: [seg.id], text, startMs, endMs: t };
      await this.emit({ type: "END_OF_TURN", payload: turn });
      await this.brain?.onCandidateTurn(this, turn);
    });
  }

  /** Live transcript while the candidate is still speaking. */
  audioPartial(seg: { id: string; text: string; startMs: number; endMs: number }) {
    return this.enqueue(async () => {
      if (!this.state.started || this.state.ended || this.state.textMode) return;
      await this.emit({
        type: "SEGMENT_PARTIAL",
        payload: { ...seg, speaker: "candidate", final: false },
      });
      await this.brain?.onPartial?.(this, seg.text);
    });
  }

  earlyTurn(turn: SpokenTurn) {
    return this.enqueue(async () => {
      if (!this.state.started || this.state.ended || this.state.textMode) return;
      await this.emit({ type: "EARLY_END_OF_TURN", payload: turn });
      await this.brain?.onEarly?.(this, turn.text);
    });
  }

  resumeTurn(turn: SpokenTurn) {
    return this.enqueue(async () => {
      if (!this.state.started || this.state.ended) return;
      await this.emit({ type: "TURN_RESUMED", payload: turn });
    });
  }

  spokenAnswer(turn: SpokenTurn) {
    return this.enqueue(async () => {
      if (!this.state.started || this.state.ended || this.state.textMode) return;
      const seg = {
        id: turn.segmentIds[0] ?? newId("seg"),
        speaker: "candidate" as const,
        text: turn.text,
        startMs: turn.startMs,
        endMs: turn.endMs,
        final: true,
      };
      await this.emit({ type: "SEGMENT_FINAL", payload: seg });
      await this.emit({ type: "END_OF_TURN", payload: turn });
      await this.brain?.onCandidateTurn(this, turn);
    });
  }

  end(reason: "time" | "done" | "user") {
    return this.enqueue(async () => {
      if (this.state.ended) return;
      await this.emit({ type: "SESSION_ENDED", payload: { reason } });
    });
  }

  idle() {
    return this.busy.catch(() => undefined);
  }
}
