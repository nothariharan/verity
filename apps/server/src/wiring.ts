import type { AppDeps, CreateInput } from "./app";
import type { Config } from "./config";
import { createEngine } from "./mind/engine";
import { FakeLlm } from "./providers/llm/fake";
import { FallbackLlm, geminiBackend, openaiBackend } from "./providers/llm/real";
import type { LlmProvider } from "./providers/llm/types";
import type { SessionHub } from "./session/hub";
import type { SessionBrain } from "./session/session";

function llmFor(config: Config): LlmProvider | null {
  if (config.providers === "fake") return new FakeLlm({});
  const primary = geminiBackend(config);
  const secondary = openaiBackend(config);
  if (!primary && !secondary) return null;
  return new FallbackLlm(primary, secondary, config.llm.timeoutMs, (line) => console.log(JSON.stringify(line)));
}

export function createBrain(config: Config): { brain: SessionBrain | null; onCreate?: AppDeps["onCreate"] } {
  const engine = createEngine(llmFor(config));
  return {
    brain: engine.brain,
    onCreate: async (hub: SessionHub, sessionId: string, input: CreateInput) => {
      const s = await hub.get(sessionId);
      await engine.onCreate(sessionId, s, input.resumeText, input.jdText);
    },
  };
}
