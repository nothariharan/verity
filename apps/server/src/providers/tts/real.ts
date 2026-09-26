import WebSocket, { type RawData } from "ws";
import type { TtsContext, TtsProvider } from "../speech";
import { normalizeForSpeech } from "./normalize";

const DEFAULT_MODEL = "eleven_flash_v2_5";

export type ElevenFlashTtsOptions = {
  apiKey?: string;
  voiceId?: string;
  /** Defaults to `eleven_flash_v2_5`. */
  modelId?: string;
};

type Inbound = {
  audio?: string;
  contextId?: string;
  final: boolean;
};

function rawToString(raw: RawData): string {
  if (typeof raw === "string") return raw;
  if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString("utf8");
  if (Array.isArray(raw)) return Buffer.concat(raw).toString("utf8");
  return raw.toString("utf8");
}

function parseInbound(raw: RawData): Inbound | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawToString(raw));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const msg = parsed as Record<string, unknown>;
  const contextId =
    typeof msg.contextId === "string" ? msg.contextId : typeof msg.context_id === "string" ? msg.context_id : undefined;
  const audio = typeof msg.audio === "string" ? msg.audio : undefined;
  const final = msg.isFinal === true || msg.is_final === true;
  if (audio === undefined && contextId === undefined && !final) return null;
  return { audio, contextId, final };
}

function pcmFromBase64(audio: string): Uint8Array {
  return new Uint8Array(Buffer.from(audio, "base64"));
}

/** Normalized text plus the trailing space the multi-stream protocol expects. */
function textForTts(text: string): string {
  return `${normalizeForSpeech(text).trimEnd()} `;
}

function silence(onDone: () => void, reason: string): TtsContext {
  console.error(reason);
  onDone();
  return { speak() {}, close() {} };
}

/**
 * ElevenLabs Flash multi-context WebSocket. One socket and one context per question.
 * Missing voice id or API key resolves a silent context so fake/dev boot does not throw.
 */
export class ElevenFlashTts implements TtsProvider {
  readonly sampleRate = 16000;

  constructor(private readonly options: ElevenFlashTtsOptions = {}) {}

  async open(questionId: string, onAudio: (pcm: Uint8Array) => void, onDone: () => void): Promise<TtsContext> {
    const voiceId = this.options.voiceId?.trim();
    const apiKey = this.options.apiKey?.trim();
    if (!voiceId) {
      return silence(
        onDone,
        `ElevenFlashTts: ELEVENLABS_VOICE_ID is missing; question ${questionId} will not be spoken.`,
      );
    }
    if (!apiKey) {
      return silence(
        onDone,
        `ElevenFlashTts: ELEVENLABS_API_KEY is missing; question ${questionId} will not be spoken.`,
      );
    }

    const modelId = this.options.modelId?.trim() || DEFAULT_MODEL;
    const url =
      `wss://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}` +
      `/multi-stream-input?model_id=${encodeURIComponent(modelId)}&output_format=pcm_16000`;

    let socket: WebSocket;
    try {
      socket = new WebSocket(url, { headers: { "xi-api-key": apiKey } });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return silence(onDone, `ElevenFlashTts: failed to open the TTS socket for ${questionId}: ${message}`);
    }

    let done = false;
    let closed = false;
    let socketOpen = false;
    let contextStarted = false;
    const outbound: string[] = [];

    const finish = () => {
      if (done) return;
      done = true;
      onDone();
    };

    const flush = () => {
      if (!socketOpen || socket.readyState !== WebSocket.OPEN) return;
      while (outbound.length > 0) {
        const raw = outbound.shift();
        if (raw) socket.send(raw);
      }
    };

    const enqueue = (payload: object) => {
      outbound.push(JSON.stringify(payload));
      flush();
    };

    const startContext = () => {
      if (contextStarted || closed) return;
      contextStarted = true;
      enqueue({
        text: " ",
        context_id: questionId,
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      });
    };

    socket.on("message", (data) => {
      if (closed || done) return;
      const inbound = parseInbound(data);
      if (!inbound) return;
      if (inbound.contextId !== undefined && inbound.contextId !== questionId) return;
      if (inbound.audio && inbound.audio.length > 0) {
        const pcm = pcmFromBase64(inbound.audio);
        if (pcm.byteLength > 0) onAudio(pcm);
      }
      if (inbound.final) finish();
    });

    socket.on("error", (err) => {
      console.error(`ElevenFlashTts: socket error for ${questionId}: ${err.message}`);
      if (!closed) finish();
    });

    socket.on("close", () => {
      if (!closed) finish();
    });

    socket.on("open", () => {
      socketOpen = true;
      if (!closed) startContext();
      flush();
    });

    const opened = await new Promise<boolean>((resolve) => {
      let settled = false;
      const succeed = () => {
        if (settled) return;
        settled = true;
        resolve(true);
      };
      const fail = () => {
        if (settled) return;
        settled = true;
        resolve(false);
      };
      socket.once("open", succeed);
      socket.once("error", fail);
      socket.once("close", fail);
    });

    if (!opened) {
      closed = true;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      if (!done) finish();
      return { speak() {}, close() {} };
    }

    return {
      speak(text: string) {
        if (closed || done) return;
        startContext();
        enqueue({ text: textForTts(text), context_id: questionId, flush: true });
      },
      close() {
        if (closed) return;
        closed = true;
        enqueue({ context_id: questionId, close_context: true });
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      },
    };
  }
}

export { normalizeForSpeech };
