import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config";
import { ScribeStt } from "../../src/providers/stt";
import { ElevenFlashTts } from "../../src/providers/tts";

const config = loadConfig();
const live = !!(config.elevenlabs.apiKey && config.elevenlabs.voiceId);

/**
 * Real ElevenLabs round trip. Skipped when keys are absent so `pnpm test` stays offline.
 * Flash speaks a sentence; Scribe must return that speech as text from the open socket,
 * before the socket is closed.
 */
describe.skipIf(!live)("scribe hears flash", () => {
  it("returns a partial transcript for spoken audio", async () => {
    const line = "I designed the partition key on the ingestion service.";
    const pcm = await speak(line);
    expect(pcm.byteLength).toBeGreaterThan(1_000);

    const heard: string[] = [];
    const stt = new ScribeStt({ apiKey: config.elevenlabs.apiKey, model: config.elevenlabs.sttModel });
    const stream = await stt.open(
      {
        onPartial: (text) => {
          if (text.trim()) heard.push(text);
        },
        onFinal: (text) => {
          if (text.trim()) heard.push(text);
        },
        onError: (err) => {
          throw err;
        },
      },
      {},
    );

    const frame = 640;
    for (let i = 0; i < pcm.byteLength; i += frame) {
      stream.write(pcm.subarray(i, Math.min(pcm.byteLength, i + frame)));
    }

    const deadline = Date.now() + 8_000;
    while (Date.now() < deadline && !heard.some((text) => /partition/i.test(text))) {
      await new Promise((r) => setTimeout(r, 100));
    }
    const beforeClose = heard.some((text) => /partition/i.test(text));
    await stream.close();
    await new Promise((r) => setTimeout(r, 400));
    const transcript = heard.join(" ");
    expect(beforeClose, `Scribe text before close: ${transcript.slice(0, 180)}`).toBe(true);
    expect(transcript).toMatch(/partition/i);
  }, 30_000);
});

function speak(line: string): Promise<Uint8Array> {
  const tts = new ElevenFlashTts({
    apiKey: config.elevenlabs.apiKey,
    voiceId: config.elevenlabs.voiceId,
    modelId: config.elevenlabs.ttsModel,
  });
  const chunks: Uint8Array[] = [];
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Flash produced no audio")), 20_000);
    void tts
      .open(
        "q_smoke",
        (pcm) => chunks.push(pcm),
        () => {
          clearTimeout(timer);
          resolve(concat(chunks));
        },
      )
      .then((ctx) => ctx.speak(line))
      .catch((err) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      });
  });
}

function concat(chunks: Uint8Array[]) {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}
