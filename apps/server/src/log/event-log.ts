import { and, asc, desc, eq, gt } from "drizzle-orm";
import { GENESIS_HASH, VerityEvent, type NewEvent, type VerityEvent as Ev } from "@verity/contracts";
import { hashEvent } from "./chain";
import { events, sessions, type Db } from "./db";

type Listener = (e: Ev) => void;

/**
 * Append-only, hash-chained log. Appends are serialized per session so the chain
 * never forks. Payloads are validated against the contracts before they are written.
 */
export class EventLog {
  private tails = new Map<string, Promise<unknown>>();
  private heads = new Map<string, { seq: number; hash: string }>();
  private listeners = new Map<string, Set<Listener>>();

  constructor(private db: Db) {}

  async createSession(id: string, meta: { mode: string; role: string; candidateName?: string }) {
    await this.db.insert(sessions).values({ id, createdAt: Date.now(), ...meta });
  }

  async listSessions() {
    return this.db.select().from(sessions).orderBy(desc(sessions.createdAt));
  }

  append(sessionId: string, e: NewEvent): Promise<Ev> {
    const prev = this.tails.get(sessionId) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(() => this.doAppend(sessionId, e));
    this.tails.set(sessionId, next);
    return next;
  }

  private async doAppend(sessionId: string, e: NewEvent): Promise<Ev> {
    const head = this.heads.get(sessionId) ?? (await this.loadHead(sessionId));
    const seq = head.seq + 1;
    const base = { seq, sessionId, atMs: Math.max(0, Math.round(e.atMs)), type: e.type, payload: e.payload };
    const hash = hashEvent(head.hash, base as Omit<Ev, "hash" | "prevHash">);
    const full = VerityEvent.parse({ ...base, prevHash: head.hash, hash }) as Ev;
    await this.db.insert(events).values({
      sessionId,
      seq,
      type: full.type,
      atMs: full.atMs,
      payload: JSON.stringify(full.payload),
      prevHash: full.prevHash,
      hash: full.hash,
    });
    this.heads.set(sessionId, { seq, hash });
    for (const l of this.listeners.get(sessionId) ?? []) l(full);
    return full;
  }

  private async loadHead(sessionId: string) {
    const rows = await this.db
      .select({ seq: events.seq, hash: events.hash })
      .from(events)
      .where(eq(events.sessionId, sessionId))
      .orderBy(desc(events.seq))
      .limit(1);
    const h = rows[0] ? { seq: rows[0].seq, hash: rows[0].hash } : { seq: 0, hash: GENESIS_HASH };
    this.heads.set(sessionId, h);
    return h;
  }

  async read(sessionId: string, afterSeq = 0): Promise<Ev[]> {
    const rows = await this.db
      .select()
      .from(events)
      .where(and(eq(events.sessionId, sessionId), gt(events.seq, afterSeq)))
      .orderBy(asc(events.seq));
    return rows.map(
      (r) =>
        ({
          seq: r.seq,
          sessionId: r.sessionId,
          atMs: r.atMs,
          type: r.type,
          payload: JSON.parse(r.payload),
          prevHash: r.prevHash,
          hash: r.hash,
        }) as Ev,
    );
  }

  subscribe(sessionId: string, l: Listener): () => void {
    let set = this.listeners.get(sessionId);
    if (!set) this.listeners.set(sessionId, (set = new Set()));
    set.add(l);
    return () => set!.delete(l);
  }
}
