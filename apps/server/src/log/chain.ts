import { createHash } from "node:crypto";
import { canonicalJson, GENESIS_HASH, type VerityEvent } from "@verity/contracts";

type Hashable = Omit<VerityEvent, "hash" | "prevHash">;

export function hashEvent(prevHash: string, e: Hashable): string {
  const body = canonicalJson({ seq: e.seq, type: e.type, sessionId: e.sessionId, atMs: e.atMs, payload: e.payload });
  return createHash("sha256").update(prevHash + body).digest("hex");
}

export type ChainResult = { ok: true; count: number } | { ok: false; count: number; brokenAtSeq: number };

export function verifyChain(events: readonly VerityEvent[]): ChainResult {
  let prev = GENESIS_HASH;
  let lastSeq = 0;
  for (const e of events) {
    if (e.seq <= lastSeq || e.prevHash !== prev || hashEvent(prev, e) !== e.hash) {
      return { ok: false, count: events.length, brokenAtSeq: e.seq };
    }
    prev = e.hash;
    lastSeq = e.seq;
  }
  return { ok: true, count: events.length };
}
