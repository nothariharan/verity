import { rm } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app";
import { FakeTts, type SttEvents, type SttProvider, type SttStream } from "../../src/providers/speech";
import { createBrain } from "../../src/wiring";
import { testConfig } from "../helpers";

const RESUME = "Designed a Kafka pipeline processing 50k events per second for click ingestion.";
const OWNED = "I designed the partition key because the old one created hot shards and I rejected a shared key.";

class ScriptStt implements SttProvider {
  text = "";
  async open(events: SttEvents): Promise<SttStream> {
    let sent = "";
    return {
      write: () => {
        if (!this.text || sent === this.text) return;
        sent = this.text;
        events.onPartial(this.text);
      },
      commit() {},
      close: async () => {},
    };
  }
}

let base: string;
let close: () => Promise<void>;
const stt = new ScriptStt();
const sessions: string[] = [];

beforeAll(async () => {
  const config = testConfig();
  const wiring = createBrain(config);
  const { app } = await buildApp({
    config,
    brain: wiring.brain,
    onCreate: wiring.onCreate,
    speech: { stt, tts: new FakeTts() },
  });
  await app.listen({ port: 0, host: "127.0.0.1" });
  const addr = app.server.address();
  if (!addr || typeof addr === "string") throw new Error("no address");
  base = `127.0.0.1:${addr.port}`;
  close = () => app.close();
});

afterAll(async () => {
  await close();
  await Promise.all(sessions.map((id) => rm(join(process.cwd(), "data", "audio", id), { recursive: true, force: true })));
});

async function createSession() {
  const created = await fetch(`http://${base}/v1/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "recruiter", role: "ML Engineer", durationSec: 900, resumeText: RESUME, candidateName: "Test" }),
  });
  const { sessionId } = (await created.json()) as { sessionId: string };
  sessions.push(sessionId);
  return sessionId;
}

function listen(sessionId: string) {
  const ws = new WebSocket(`ws://${base}/v1/session/${sessionId}`);
  const events: { type: string; payload: Record<string, unknown> }[] = [];
  const ready = new Promise<void>((resolve, reject) => {
    ws.addEventListener("open", () => resolve());
    ws.addEventListener("error", () => reject(new Error("socket failed")));
  });
  ws.addEventListener("message", (m) => {
    if (typeof m.data !== "string") return;
    const msg = JSON.parse(m.data) as { type?: string; seq?: number; payload?: Record<string, unknown> };
    if (typeof msg.seq === "number" && msg.type && msg.payload) events.push({ type: msg.type, payload: msg.payload });
  });
  return { ws, events, ready };
}

describe("spoken socket", () => {
  it("turns a spoken answer into a receipt and a seekable clip", async () => {
    const sessionId = await createSession();
    const { ws, events, ready } = listen(sessionId);
    await ready;
    stt.text = OWNED;
    ws.send(JSON.stringify({ type: "HELLO", textMode: false }));
    ws.send(JSON.stringify({ type: "START" }));
    await new Promise((r) => setTimeout(r, 200));
    ws.send(new Uint8Array(640));

    const deadline = Date.now() + 8_000;
    while (Date.now() < deadline && !events.some((e) => e.type === "RECEIPT_CREATED")) {
      await new Promise((r) => setTimeout(r, 50));
    }
    ws.close();

    expect(events.some((e) => e.type === "END_OF_TURN")).toBe(true);
    const receipt = events.find((e) => e.type === "RECEIPT_CREATED");
    expect(receipt).toBeTruthy();
    const clip = receipt!.payload.clip as { startMs: number; endMs: number };
    expect(clip.endMs - clip.startMs).toBeLessThanOrEqual(20_000);
    expect(String(receipt!.payload.quote)).toContain("partition key");

    const audioUrl = `http://${base}/v1/sessions/${sessionId}/audio/candidate`;
    const full = await fetch(audioUrl);
    expect(full.status).toBe(200);
    const wav = Buffer.from(await full.arrayBuffer());
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.readUInt32LE(40)).toBe(wav.length - 44);

    const startByte = 44 + Math.floor((clip.startMs / 1000) * 16000) * 2;
    expect(startByte).toBeLessThan(wav.length);
    const slice = await fetch(audioUrl, { headers: { range: `bytes=${startByte}-${startByte + 63}` } });
    expect(slice.status).toBe(206);
    expect(slice.headers.get("content-range")).toContain(`${startByte}-`);
    expect((await slice.arrayBuffer()).byteLength).toBe(64);
  });

  it("holds a one-word spoken answer before ending the turn", async () => {
    const sessionId = await createSession();
    const { ws, events, ready } = listen(sessionId);
    await ready;
    stt.text = "Yes.";
    ws.send(JSON.stringify({ type: "HELLO", textMode: false }));
    ws.send(JSON.stringify({ type: "START" }));
    await new Promise((r) => setTimeout(r, 200));
    const spokeAt = Date.now();
    ws.send(new Uint8Array(640));
    await new Promise((r) => setTimeout(r, 900));
    expect(events.some((e) => e.type === "END_OF_TURN")).toBe(false);
    const deadline = Date.now() + 4_000;
    while (Date.now() < deadline && !events.some((e) => e.type === "END_OF_TURN")) {
      await new Promise((r) => setTimeout(r, 50));
    }
    ws.close();
    const ended = events.find((e) => e.type === "END_OF_TURN");
    expect(ended).toBeTruthy();
    expect(Date.now() - spokeAt).toBeGreaterThanOrEqual(1_400);
  });
});
