import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";
import type { VerityEvent } from "@verity/contracts";
import { buildApp } from "../../src/app";
import { testConfig } from "../helpers";

let base: string;
let close: () => Promise<void>;

beforeAll(async () => {
  const { app } = await buildApp({ config: testConfig() });
  await app.listen({ port: 0, host: "127.0.0.1" });
  const addr = app.server.address();
  if (!addr || typeof addr === "string") throw new Error("no address");
  base = `127.0.0.1:${addr.port}`;
  close = () => app.close();
});
afterAll(() => close());

function connect(id: string) {
  const ws = new WebSocket(`ws://${base}/v1/session/${id}`);
  const events: VerityEvent[] = [];
  const waiters: { pred: (e: VerityEvent[]) => boolean; resolve: () => void }[] = [];
  let ready: () => void;
  const readyP = new Promise<void>((r) => (ready = r));
  ws.on("message", (raw) => {
    const m = JSON.parse(String(raw));
    if (m.type === "READY") return ready();
    if (typeof m.seq === "number") events.push(m);
    for (const w of [...waiters]) if (w.pred(events)) (waiters.splice(waiters.indexOf(w), 1), w.resolve());
  });
  const open = new Promise<void>((r) => ws.on("open", () => r()));
  return {
    ws,
    events,
    open,
    readyP,
    send: (m: unknown) => ws.send(JSON.stringify(m)),
    until: (pred: (e: VerityEvent[]) => boolean) =>
      pred(events) ? Promise.resolve() : new Promise<void>((resolve) => waiters.push({ pred, resolve })),
  };
}

describe("session websocket", () => {
  it("round-trips and replays only newer events on reconnect", async () => {
    const res = await fetch(`http://${base}/v1/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "ML Engineer", durationSec: 600 }),
    });
    expect(res.status).toBe(201);
    const { sessionId } = (await res.json()) as { sessionId: string };

    const a = connect(sessionId);
    await a.open;
    a.send({ type: "HELLO", textMode: true });
    await a.readyP;
    expect(a.events.map((e) => e.type)).toEqual(["SESSION_CREATED"]);

    a.send({ type: "START" });
    a.send({ type: "TEXT_ANSWER", text: "I keyed the topic by user id." });
    await a.until((es) => es.some((e) => e.type === "END_OF_TURN"));
    const lastSeq = a.events.at(-1)!.seq;
    a.ws.close();

    // New events while disconnected are delivered on reconnect; old ones are not re-sent.
    const b = connect(sessionId);
    await b.open;
    b.send({ type: "HELLO", lastSeq, textMode: true });
    await b.readyP;
    expect(b.events).toEqual([]);
    b.send({ type: "END" });
    await b.until((es) => es.some((e) => e.type === "SESSION_ENDED"));
    expect(b.events.every((e) => e.seq > lastSeq)).toBe(true);
    b.ws.close();

    const verify = await (await fetch(`http://${base}/v1/sessions/${sessionId}/verify`)).json();
    expect(verify).toMatchObject({ ok: true });
  });
});
