import WebSocket from "ws";
import type { SttEvents, SttProvider, SttStream, SttWord } from "../speech";

type RawData = Buffer | ArrayBuffer | Buffer[];

const REALTIME_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime";
const SAMPLE_RATE = 16000;
/** Realtime keyterm prompting: 50 terms, 20 characters each. */
const MAX_KEYTERMS = 50;
const MAX_KEYTERM_CHARS = 20;

export interface ScribeSttOptions {
  apiKey?: string;
  /** Defaults to scribe_v2_realtime (ELEVENLABS_STT_MODEL). */
  model?: string;
}

/**
 * ElevenLabs Scribe v2 Realtime. Turn detection stays in session/turns.ts;
 * this socket only forwards PCM and maps partial / committed transcripts.
 */
export class ScribeStt implements SttProvider {
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(opts: ScribeSttOptions = {}) {
    this.apiKey = opts.apiKey?.trim() || undefined;
    this.model = opts.model?.trim() || "scribe_v2_realtime";
  }

  async open(events: SttEvents, opts: { keyterms?: string[] }): Promise<SttStream> {
    if (!this.apiKey) {
      events.onError(new Error("ELEVENLABS_API_KEY is not set"));
      return { write() {}, async close() {} };
    }

    const ws = new WebSocket(scribeRealtimeUrl(this.model, opts.keyterms), {
      headers: { "xi-api-key": this.apiKey },
    });
    const pending: string[] = [];
    let pendingPlain: string | null = null;
    let lastFinalText: string | null = null;
    let closed = false;

    const flushPlain = () => {
      if (pendingPlain === null) return;
      const text = pendingPlain;
      pendingPlain = null;
      lastFinalText = text;
      events.onFinal(text);
    };

    const sendChunk = (frame: Uint8Array, commit: boolean) => {
      const payload = JSON.stringify({
        message_type: "input_audio_chunk",
        audio_base_64: Buffer.from(frame.buffer, frame.byteOffset, frame.byteLength).toString("base64"),
        commit,
        sample_rate: SAMPLE_RATE,
      });
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
          return;
        }
        if (!commit && ws.readyState === WebSocket.CONNECTING) pending.push(payload);
      } catch (err) {
        events.onError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    ws.on("message", (data) => {
      let msg: { message_type?: string; text?: string; words?: unknown; error?: string };
      try {
        msg = JSON.parse(rawToString(data)) as typeof msg;
      } catch (err) {
        events.onError(err instanceof Error ? err : new Error(String(err)));
        return;
      }
      if (typeof msg.error === "string") {
        events.onError(new Error(msg.error));
        return;
      }
      if (msg.message_type === "partial_transcript" && typeof msg.text === "string") {
        flushPlain();
        events.onPartial(msg.text);
        return;
      }
      if (msg.message_type === "committed_transcript_with_timestamps" && typeof msg.text === "string") {
        pendingPlain = null;
        lastFinalText = msg.text;
        events.onFinal(msg.text, mapWords(msg.words));
        return;
      }
      if (msg.message_type === "committed_transcript" && typeof msg.text === "string") {
        if (msg.text === lastFinalText) {
          lastFinalText = null;
          return;
        }
        pendingPlain = msg.text;
      }
    });

    await new Promise<void>((resolve) => {
      const onEarlyError = (err: Error) => {
        events.onError(err);
        resolve();
      };
      ws.once("error", onEarlyError);
      ws.once("open", () => {
        ws.off("error", onEarlyError);
        ws.on("error", (err) => {
          events.onError(err instanceof Error ? err : new Error(String(err)));
        });
        for (const payload of pending) ws.send(payload);
        pending.length = 0;
        resolve();
      });
    });

    return {
      write(frame) {
        if (closed || frame.byteLength === 0) return;
        sendChunk(frame, false);
      },
      async close() {
        if (closed) return;
        closed = true;
        if (ws.readyState === WebSocket.OPEN) {
          try {
            sendChunk(new Uint8Array(), true);
          } catch (err) {
            events.onError(err instanceof Error ? err : new Error(String(err)));
          }
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.terminate();
        }
        if (ws.readyState === WebSocket.CLOSED) {
          flushPlain();
          return;
        }
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            if (ws.readyState !== WebSocket.CLOSED) ws.terminate();
            resolve();
          }, 1_500);
          ws.once("close", () => {
            clearTimeout(timer);
            resolve();
          });
        });
        flushPlain();
      },
    };
  }
}

export function scribeRealtimeUrl(model: string, keyterms?: string[]): string {
  const q = new URLSearchParams();
  q.set("model_id", model);
  q.set("audio_format", "pcm_16000");
  q.set("commit_strategy", "manual");
  q.set("include_timestamps", "true");
  for (const term of limitKeyterms(keyterms)) q.append("keyterms", term);
  return `${REALTIME_URL}?${q.toString()}`;
}

function limitKeyterms(keyterms: string[] | undefined): string[] {
  if (!keyterms?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of keyterms) {
    const term = raw.trim();
    if (!term || term.length > MAX_KEYTERM_CHARS || seen.has(term)) continue;
    seen.add(term);
    out.push(term);
    if (out.length >= MAX_KEYTERMS) break;
  }
  return out;
}

function mapWords(words: unknown): SttWord[] | undefined {
  if (!Array.isArray(words)) return undefined;
  const out: SttWord[] = [];
  for (const word of words) {
    if (!word || typeof word !== "object") continue;
    const rec = word as { text?: unknown; start?: unknown; end?: unknown; type?: unknown };
    if (rec.type === "spacing") continue;
    if (typeof rec.text !== "string" || typeof rec.start !== "number" || typeof rec.end !== "number") continue;
    out.push({ w: rec.text, s: rec.start, e: rec.end });
  }
  return out;
}

function rawToString(data: RawData): string {
  if (typeof data === "string") return data;
  if (Buffer.isBuffer(data)) return data.toString("utf8");
  if (Array.isArray(data)) return Buffer.concat(data).toString("utf8");
  return Buffer.from(data).toString("utf8");
}
