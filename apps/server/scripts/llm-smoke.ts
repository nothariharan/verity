import { z } from "zod";
import { loadConfig } from "../src/config";
import { FallbackLlm, geminiBackend, openaiBackend } from "../src/providers/llm/real";

const cfg = loadConfig();
const schema = z.object({ word: z.string(), n: z.number() });
const req = { role: "assessor" as const, name: "smoke.v1", system: "Reply in JSON.", prompt: 'Return {"word":"verity","n":3}.', schema };

for (const [name, b] of [
  ["gemini", geminiBackend(cfg)],
  ["openai", openaiBackend(cfg)],
] as const) {
  if (!b) {
    console.log(`${name}: no key`);
    continue;
  }
  try {
    const r = await new FallbackLlm(b, null, 20000).generate(req);
    console.log(`${name}: ok model=${r.model} ms=${r.ms} data=${JSON.stringify(r.data)}`);
  } catch (e) {
    console.log(`${name}: FAIL ${(e as Error).message.slice(0, 300)}`);
  }
}
