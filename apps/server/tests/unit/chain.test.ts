import { describe, expect, it } from "vitest";
import { reduceAll, type NewEvent } from "@verity/contracts";
import { verifyChain } from "../../src/log/chain";
import { openDb } from "../../src/log/db";
import { EventLog } from "../../src/log/event-log";

async function seededLog(n: number) {
  const { db } = await openDb("file::memory:");
  const log = new EventLog(db);
  await log.append("ses_a", { type: "SESSION_CREATED", atMs: 0, payload: { mode: "recruiter", durationSec: 600, role: "SWE" } });
  for (let i = 0; i < n; i++) {
    await log.append("ses_a", {
      type: "LATENCY_SAMPLE",
      atMs: i * 7,
      payload: { segment: "eot_to_audio", ms: 100 + i },
    });
  }
  return log;
}

describe("hash chain", () => {
  it("verifies an untouched log", async () => {
    const log = await seededLog(10);
    expect(verifyChain(await log.read("ses_a"))).toEqual({ ok: true, count: 11 });
  });

  it("fails at the tampered seq", async () => {
    const log = await seededLog(10);
    const events = await log.read("ses_a");
    const tampered = events.map((e) => (e.seq === 6 ? { ...e, payload: { ...e.payload, ms: 1 } } : e)) as typeof events;
    expect(verifyChain(tampered)).toMatchObject({ ok: false, brokenAtSeq: 6 });
  });

  it("serializes concurrent appends without forking", async () => {
    const { db } = await openDb("file::memory:");
    const log = new EventLog(db);
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        log.append("ses_b", { type: "LATENCY_SAMPLE", atMs: i, payload: { segment: "x", ms: i } }),
      ),
    );
    const events = await log.read("ses_b");
    expect(events.map((e) => e.seq)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    expect(verifyChain(events).ok).toBe(true);
  });

  it("rejects invalid payloads before writing", async () => {
    const { db } = await openDb("file::memory:");
    const log = new EventLog(db);
    await expect(
      log.append("ses_c", { type: "SESSION_ENDED", atMs: 0, payload: { reason: "bored" } } as unknown as NewEvent),
    ).rejects.toThrow();
    expect(await log.read("ses_c")).toEqual([]);
  });

  it("rebuild from storage equals incremental projection", async () => {
    const { db } = await openDb("file::memory:");
    const log = new EventLog(db);
    const live: Parameters<typeof reduceAll>[0][number][] = [];
    const rand = mulberry32(42);
    for (let i = 0; i < 60; i++) {
      const r = rand();
      const e: NewEvent =
        r < 0.3
          ? { type: "OBSERVATION", atMs: i * 100, payload: { id: `obs_${i}`, kind: "FOCUS_LOST", startMs: i * 100, detail: "Tab hidden" } }
          : r < 0.6
            ? { type: "SEGMENT_FINAL", atMs: i * 100, payload: { id: `seg_${i}`, speaker: "candidate", text: `answer ${i}`, startMs: i * 100, endMs: i * 100 + 50, final: true } }
            : { type: "LATENCY_SAMPLE", atMs: i * 100, payload: { segment: "eot", ms: Math.round(r * 1000) } };
      live.push(await log.append("ses_p", e));
    }
    expect(reduceAll(await log.read("ses_p"))).toEqual(reduceAll(live));
  });
});

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
