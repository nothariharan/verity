import type { z } from "zod";
import type { LlmRole } from "../../config";

export interface LlmRequest<T> {
  role: LlmRole;
  /** Short name used for the JSON schema and logs, e.g. "assessor.v1". */
  name: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
  signal?: AbortSignal;
}

export interface LlmResult<T> {
  data: T;
  provider: "gemini" | "openai" | "fake";
  model: string;
  ms: number;
  fallback: boolean;
}

export interface LlmProvider {
  generate<T>(req: LlmRequest<T>): Promise<LlmResult<T>>;
}

export class LlmError extends Error {
  constructor(
    message: string,
    readonly kind: "timeout" | "http" | "rate_limit" | "schema" | "config" | "aborted",
    readonly cause?: unknown,
  ) {
    super(message);
  }
}
