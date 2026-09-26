import type { LlmRole } from "../../config";
import { LlmError, type LlmProvider, type LlmRequest, type LlmResult } from "./types";

export type FakeHandler = (req: LlmRequest<unknown>) => unknown | Promise<unknown>;

/**
 * Deterministic LLM for offline runs and tests. Each role has a handler; optional
 * injected delay and failures let tests exercise timeouts and fallbacks.
 */
export class FakeLlm implements LlmProvider {
  calls: { role: LlmRole; name: string; prompt: string }[] = [];
  constructor(
    private handlers: Partial<Record<LlmRole, FakeHandler>>,
    private opts: { delayMs?: number; failRoles?: LlmRole[] } = {},
  ) {}

  setHandler(role: LlmRole, h: FakeHandler) {
    this.handlers[role] = h;
  }

  async generate<T>(req: LlmRequest<T>): Promise<LlmResult<T>> {
    this.calls.push({ role: req.role, name: req.name, prompt: req.prompt });
    const t0 = performance.now();
    if (this.opts.delayMs) await new Promise((r) => setTimeout(r, this.opts.delayMs));
    if (req.signal?.aborted) throw new LlmError("aborted", "aborted");
    if (this.opts.failRoles?.includes(req.role)) throw new LlmError("fake failure", "http");
    const h = this.handlers[req.role];
    if (!h) throw new LlmError(`FakeLlm has no handler for role ${req.role}`, "config");
    const parsed = req.schema.safeParse(await h(req as LlmRequest<unknown>));
    if (!parsed.success) throw new LlmError(`fake schema mismatch: ${parsed.error.message}`, "schema");
    return { data: parsed.data, provider: "fake", model: "fake", ms: Math.round(performance.now() - t0), fallback: false };
  }
}
