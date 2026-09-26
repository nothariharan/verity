import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { z } from "zod";
import type { Config, LlmRole } from "../../config";
import { LlmError, type LlmProvider, type LlmRequest, type LlmResult } from "./types";

type Backend = {
  name: "gemini" | "openai";
  model: (role: LlmRole) => string;
  call: (req: LlmRequest<unknown>, model: string, signal: AbortSignal) => Promise<string>;
};

function jsonSchemaFor(schema: z.ZodType<unknown>) {
  const js = z.toJSONSchema(schema, { target: "draft-7", unrepresentable: "any" }) as Record<string, unknown>;
  delete js.$schema;
  return js;
}

export function geminiBackend(cfg: Config): Backend | null {
  const { apiKey, model } = cfg.llm.gemini;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  return {
    name: "gemini",
    model: (role) => cfg.llm.roleModels[role] ?? model,
    async call(req, m, signal) {
      const res = await ai.models.generateContent({
        model: m,
        contents: req.prompt,
        config: {
          systemInstruction: req.system,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchemaFor(req.schema),
          temperature: req.temperature ?? 0.2,
          abortSignal: signal,
        },
      });
      return res.text ?? "";
    },
  };
}

export function openaiBackend(cfg: Config): Backend | null {
  const { apiKey, model } = cfg.llm.openai;
  if (!apiKey) return null;
  const client = new OpenAI({ apiKey });
  return {
    name: "openai",
    model: () => model,
    async call(req, m, signal) {
      const res = await client.chat.completions.create(
        {
          model: m,
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: req.prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: req.name.replace(/[^a-zA-Z0-9_-]/g, "_"), schema: jsonSchemaFor(req.schema), strict: false },
          },
        },
        { signal },
      );
      return res.choices[0]?.message?.content ?? "";
    },
  };
}

function classify(err: unknown): LlmError {
  if (err instanceof LlmError) return err;
  const status = (err as { status?: number })?.status;
  const msg = err instanceof Error ? err.message : String(err);
  if (status === 429 || /429|rate/i.test(msg)) return new LlmError(msg, "rate_limit", err);
  return new LlmError(msg, "http", err);
}

async function attempt<T>(b: Backend, req: LlmRequest<T>, timeoutMs: number): Promise<{ data: T; model: string; ms: number }> {
  const model = b.model(req.role);
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  req.signal?.addEventListener("abort", onAbort);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    const aborted = new Promise<never>((_, reject) =>
      ctrl.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }),
    );
    const text = await Promise.race([b.call(req as LlmRequest<unknown>, model, ctrl.signal), aborted]);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new LlmError(`${b.name} returned non-JSON`, "schema", e);
    }
    const parsed = req.schema.safeParse(json);
    if (!parsed.success) throw new LlmError(`${b.name} schema mismatch: ${parsed.error.message}`, "schema");
    return { data: parsed.data, model, ms: Math.round(performance.now() - t0) };
  } catch (e) {
    if (req.signal?.aborted) throw new LlmError("aborted", "aborted", e);
    if (ctrl.signal.aborted) throw new LlmError(`${b.name} timed out after ${timeoutMs} ms`, "timeout", e);
    throw classify(e);
  } finally {
    clearTimeout(timer);
    req.signal?.removeEventListener("abort", onAbort);
  }
}

/** Gemini primary, OpenAI fallback once on timeout / 5xx / 429 / schema failure (ADR-017). */
export class FallbackLlm implements LlmProvider {
  constructor(
    private primary: Backend | null,
    private secondary: Backend | null,
    private timeoutMs: number,
    private log: (line: Record<string, unknown>) => void = () => {},
  ) {
    if (!primary && !secondary) throw new LlmError("no LLM API key configured", "config");
  }

  async generate<T>(req: LlmRequest<T>): Promise<LlmResult<T>> {
    const first = this.primary ?? this.secondary!;
    const second = this.primary ? this.secondary : null;
    try {
      const r = await attempt(first, req, this.timeoutMs);
      this.log({ llm: req.name, provider: first.name, model: r.model, ms: r.ms, fallback: false });
      return { ...r, provider: first.name, fallback: false };
    } catch (e) {
      const err = classify(e);
      if (err.kind === "aborted" || !second) throw err;
      this.log({ llm: req.name, provider: first.name, error: err.kind, message: err.message.slice(0, 200) });
      const r = await attempt(second, req, this.timeoutMs);
      this.log({ llm: req.name, provider: second.name, model: r.model, ms: r.ms, fallback: true });
      return { ...r, provider: second.name, fallback: true };
    }
  }
}
