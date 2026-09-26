export type ProviderMode = "fake" | "real";

export interface Config {
  port: number;
  databaseUrl: string;
  providers: ProviderMode;
  llm: {
    timeoutMs: number;
    gemini: { apiKey?: string; model: string };
    openai: { apiKey?: string; model: string };
    roleModels: Partial<Record<LlmRole, string>>;
  };
  elevenlabs: { apiKey?: string; sttModel: string; ttsModel: string; voiceId?: string };
  webOrigin: string[];
}

export type LlmRole = "extractor" | "assessor" | "live" | "drafter" | "summary";

const nonEmpty = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

/** `luna` is not a model id. The working fallback is gpt-6-luna. */
function openaiModel(value: string | undefined) {
  const model = nonEmpty(value);
  if (!model || model === "luna") return "gpt-6-luna";
  return model;
}

function hasAnyKey(env: NodeJS.ProcessEnv) {
  return !!(nonEmpty(env.GEMINI_API_KEY) || nonEmpty(env.OPENAI_API_KEY) || nonEmpty(env.ELEVENLABS_API_KEY));
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 8787),
    databaseUrl: env.DATABASE_URL ?? "file:./data/verity.db",
    providers: env.PROVIDERS === "fake" ? "fake" : env.PROVIDERS === "real" || hasAnyKey(env) ? "real" : "fake",
    llm: {
      timeoutMs: Number(env.LLM_TIMEOUT_MS ?? 8000),
      gemini: { apiKey: nonEmpty(env.GEMINI_API_KEY), model: env.GEMINI_MODEL ?? "gemini-3.5-flash-lite" },
      openai: { apiKey: nonEmpty(env.OPENAI_API_KEY), model: openaiModel(env.OPENAI_MODEL) },
      roleModels: {
        extractor: nonEmpty(env.MODEL_EXTRACTOR),
        assessor: nonEmpty(env.MODEL_ASSESSOR),
        live: nonEmpty(env.MODEL_LIVE),
        drafter: nonEmpty(env.MODEL_DRAFTER),
      },
    },
    elevenlabs: {
      apiKey: nonEmpty(env.ELEVENLABS_API_KEY),
      sttModel: env.ELEVENLABS_STT_MODEL ?? "scribe_v2_realtime",
      ttsModel: env.ELEVENLABS_TTS_MODEL ?? "eleven_flash_v2_5",
      voiceId: nonEmpty(env.ELEVENLABS_VOICE_ID),
    },
    webOrigin: (env.WEB_ORIGIN ?? "http://localhost:3000").split(","),
  };
}
