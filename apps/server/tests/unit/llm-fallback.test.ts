import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FallbackLlm } from "../../src/providers/llm/real";

const schema = z.object({ answer: z.string() });
const req = { role: "assessor" as const, name: "t.v1", system: "s", prompt: "p", schema };

const backend = (name: "gemini" | "openai", impl: () => Promise<string>) => ({
  name,
  model: () => `${name}-model`,
  call: impl,
});

describe("Gemini → OpenAI fallback", () => {
  it("uses the primary when it succeeds", async () => {
    const llm = new FallbackLlm(backend("gemini", async () => '{"answer":"g"}'), backend("openai", async () => '{"answer":"o"}'), 500);
    const r = await llm.generate(req);
    expect(r).toMatchObject({ data: { answer: "g" }, provider: "gemini", fallback: false });
  });

  it("falls back on schema failure", async () => {
    const llm = new FallbackLlm(backend("gemini", async () => '{"nope":1}'), backend("openai", async () => '{"answer":"o"}'), 500);
    const r = await llm.generate(req);
    expect(r).toMatchObject({ data: { answer: "o" }, provider: "openai", fallback: true });
  });

  it("falls back on timeout", async () => {
    const slow = backend("gemini", () => new Promise((r) => setTimeout(() => r('{"answer":"late"}'), 300)));
    const llm = new FallbackLlm(slow, backend("openai", async () => '{"answer":"o"}'), 50);
    const r = await llm.generate(req);
    expect(r.provider).toBe("openai");
  });

  it("falls back on 429", async () => {
    const limited = backend("gemini", async () => {
      throw Object.assign(new Error("Too many requests"), { status: 429 });
    });
    const llm = new FallbackLlm(limited, backend("openai", async () => '{"answer":"o"}'), 500);
    expect((await llm.generate(req)).fallback).toBe(true);
  });
});
