import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app";
import { createBrain } from "../../src/wiring";
import { testConfig } from "../helpers";

const RESUME = [
  "Designed a Kafka pipeline processing 50k events per second for click ingestion.",
  "Built a retrieval system over 100k internal documents with FAISS.",
].join("\n");

const ACCEPT = "application/json, text/event-stream";

function rpc(method: string, params?: unknown, id: number = 1) {
  return { jsonrpc: "2.0", id, method, ...(params === undefined ? {} : { params }) };
}

describe("mcp", () => {
  it("rejects a missing key and a foreign origin, and accepts the website origin", async () => {
    const config = testConfig({ mcpApiKey: "secret", webOrigin: ["http://localhost:3000"] });
    const { app } = await buildApp({ config });
    const headers = { accept: ACCEPT };
    const missing = await app.inject({ method: "POST", url: "/mcp", headers, payload: rpc("initialize", { protocolVersion: "2025-03-26" }) });
    expect(missing.statusCode).toBe(401);

    const foreign = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: { ...headers, authorization: "Bearer secret", origin: "https://evil.example" },
      payload: rpc("initialize", { protocolVersion: "2025-03-26" }),
    });
    expect(foreign.statusCode).toBe(403);

    const ok = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: { ...headers, authorization: "Bearer secret", origin: "http://localhost:3000" },
      payload: rpc("initialize", { protocolVersion: "2025-03-26", clientInfo: { name: "test", version: "0" } }),
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().result.serverInfo.name).toBe("verity");
    expect(ok.json().result.protocolVersion).toBe("2025-03-26");
    await app.close();
  });

  it("creates an interview, lists it, and reads the dossier", async () => {
    const config = testConfig({ webOrigin: ["http://localhost:3000"] });
    const { app } = await buildApp({ config, ...createBrain(config) });
    const headers = { accept: ACCEPT };

    const listed = await app.inject({ method: "POST", url: "/mcp", headers, payload: rpc("tools/list", {}) });
    expect(listed.statusCode).toBe(200);
    expect(listed.json().result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      "create_interview",
      "list_interviews",
      "get_dossier",
    ]);

    const created = await app.inject({
      method: "POST",
      url: "/mcp",
      headers,
      payload: rpc("tools/call", {
        name: "create_interview",
        arguments: { resumeText: RESUME, role: "ML Engineer", candidateName: "Ada" },
      }),
    });
    expect(created.statusCode).toBe(200);
    expect(created.json().result.isError).toBeUndefined();
    const body = JSON.parse(created.json().result.content[0].text) as { sessionId: string; interviewUrl: string; watchUrl: string };
    expect(body.sessionId).toMatch(/^ses_/);
    expect(body.interviewUrl).toBe(`http://localhost:3000/interview/${body.sessionId}`);
    expect(body.watchUrl).toBe(`http://localhost:3000/app/live/${body.sessionId}`);

    const dossier = await app.inject({
      method: "POST",
      url: "/mcp",
      headers,
      payload: rpc("tools/call", { name: "get_dossier", arguments: { sessionId: body.sessionId } }),
    });
    const state = JSON.parse(dossier.json().result.content[0].text) as { caseOrder: string[] };
    expect(state.caseOrder.length).toBeGreaterThan(0);

    const rows = JSON.parse(
      (
        await app.inject({
          method: "POST",
          url: "/mcp",
          headers,
          payload: rpc("tools/call", { name: "list_interviews", arguments: {} }),
        })
      ).json().result.content[0].text,
    ) as { id: string }[];
    expect(rows.some((row) => row.id === body.sessionId)).toBe(true);

    const accepted = await app.inject({
      method: "POST",
      url: "/mcp",
      headers,
      payload: { jsonrpc: "2.0", method: "notifications/initialized" },
    });
    expect(accepted.statusCode).toBe(202);

    const stream = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: { accept: "text/event-stream" },
      payload: rpc("ping"),
    });
    expect(stream.statusCode).toBe(200);
    expect(stream.headers["content-type"]).toContain("text/event-stream");
    expect(stream.body).toContain('"result":{}');

    expect((await app.inject({ method: "GET", url: "/mcp" })).statusCode).toBe(405);
    await app.close();
  });
});
