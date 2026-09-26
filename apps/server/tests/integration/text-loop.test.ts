import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app";
import { createBrain } from "../../src/wiring";
import { testConfig } from "../helpers";

let base: string;
let close: () => Promise<void>;

beforeAll(async () => {
  const config = testConfig();
  const { app } = await buildApp({ config, ...createBrain(config) });
  await app.listen({ port: 0, host: "127.0.0.1" });
  const addr = app.server.address();
  if (!addr || typeof addr === "string") throw new Error("no address");
  base = `127.0.0.1:${addr.port}`;
  close = () => app.close();
});
afterAll(() => close());

const RESUME = [
  "Designed a Kafka pipeline processing 50k events per second for click ingestion.",
  "Built a retrieval system over 100k internal documents with FAISS.",
  "Helped the platform team with Kubernetes autoscaling dashboards.",
].join("\n");

describe("text interview loop", () => {
  it("opens cases from the resume and moves belief on a specific answer", async () => {
    const created = await fetch(`http://${base}/v1/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "ML Engineer", durationSec: 900, resumeText: RESUME, candidateName: "Test" }),
    });
    const { sessionId } = (await created.json()) as { sessionId: string };
    const before = await (await fetch(`http://${base}/v1/sessions/${sessionId}`)).json();
    expect(before.caseOrder.length).toBe(3);

    const ws = new WebSocket(`ws://${base}/v1/session/${sessionId}`);
    const events: { type: string; payload: Record<string, unknown> }[] = [];
    await new Promise<void>((r) => ws.addEventListener("open", () => r()));
    const done = new Promise<void>((resolve) => {
      ws.addEventListener("message", (m) => {
        const msg = JSON.parse(String(m.data));
        if (typeof msg.seq === "number") events.push(msg);
        if (events.filter((e) => e.type === "QUESTION_COMMITTED").length >= 3) resolve();
      });
    });
    ws.send(JSON.stringify({ type: "HELLO", textMode: true }));
    ws.send(JSON.stringify({ type: "START" }));
    await new Promise((r) => setTimeout(r, 200));
    ws.send(JSON.stringify({
      type: "TEXT_ANSWER",
      text: "I designed the partition key myself, keyed by user id, and rejected a bigger cluster because cost doubled for almost no gain.",
    }));
    await done;
    ws.close();

    const questions = events.filter((e) => e.type === "QUESTION_COMMITTED");
    expect(questions.length).toBeGreaterThanOrEqual(2);
    const belief = events.find((e) => e.type === "BELIEF_UPDATED");
    expect(belief).toBeTruthy();
    const after = (belief!.payload as { after: { owned: number } }).after.owned;
    const prev = (belief!.payload as { before: { owned: number } }).before.owned;
    expect(after).toBeGreaterThan(prev);
    const receipt = events.find((e) => e.type === "RECEIPT_CREATED");
    expect(String((receipt!.payload as { quote: string }).quote).length).toBeGreaterThan(10);
  });
});
