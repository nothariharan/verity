import { afterEach, describe, expect, it } from "vitest";
import { openDb } from "../../src/log/db";
import { EventLog } from "../../src/log/event-log";
import { createEngine } from "../../src/mind/engine";
import { FakeStt, FakeTts } from "../../src/providers/speech";
import { LiveVoice } from "../../src/session/live";
import { Session } from "../../src/session/session";

const RESUME = "Designed a Kafka pipeline processing 50k events per second for click ingestion.";
const OWNED =
  "I designed the partition key because the old one created hot shards and I rejected a shared key.";
const BUZZ = "kubernetes kafka faiss autoscaling distributed microservices";

let closeVoice: (() => Promise<void>) | null = null;
afterEach(async () => {
  await closeVoice?.();
  closeVoice = null;
});

async function boot() {
  const { db } = await openDb("file::memory:");
  const log = new EventLog(db);
  const engine = createEngine(null);
  const id = `ses_${Math.random().toString(16).slice(2, 14)}`;
  await log.createSession(id, { mode: "practice", role: "ML Engineer" });
  const session = await Session.load(id, log, engine.brain);
  await session.emit({
    type: "SESSION_CREATED",
    payload: { mode: "practice", durationSec: 900, role: "ML Engineer" },
  });
  await engine.onCreate(id, session, RESUME, "");
  const voice = new LiveVoice(session, new FakeStt(), new FakeTts(), { json: () => {}, pcm: () => {} });
  closeVoice = () => voice.close();
  await voice.open();
  await session.start(false);
  return { log, id, voice };
}

describe("live voice", () => {
  it("moves the ring provisionally before the turn ends on a specific answer", async () => {
    const { log, id, voice } = await boot();
    voice.hear(OWNED, 1_000);
    voice.pump(1_700);
    await voice.settled();
    const events = await log.read(id);
    const provisionalAt = events.findIndex((e) => e.type === "BELIEF_UPDATED" && e.payload.provisional === true);
    const endAt = events.findIndex((e) => e.type === "END_OF_TURN");
    expect(provisionalAt).toBeGreaterThan(-1);
    expect(endAt).toBeGreaterThan(provisionalAt);
  });

  it("does not move the ring provisionally for a buzzword list", async () => {
    const { log, id, voice } = await boot();
    voice.hear(BUZZ, 1_000);
    voice.pump(1_700);
    await voice.settled();
    const events = await log.read(id);
    expect(events.some((e) => e.type === "BELIEF_UPDATED" && e.payload.provisional === true)).toBe(false);
    expect(events.some((e) => e.type === "END_OF_TURN")).toBe(true);
  });
});
