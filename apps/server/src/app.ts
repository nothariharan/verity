import { createReadStream, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { ClientMessage, reduceAll, SessionMode, type VerityEvent } from "@verity/contracts";
import { z } from "zod";
import type { Config } from "./config";
import { verifyChain } from "./log/chain";
import { openDb } from "./log/db";
import { EventLog } from "./log/event-log";
import type { SttProvider, TtsProvider } from "./providers/speech";
import { SessionHub } from "./session/hub";
import { LiveVoice, type LiveSink } from "./session/live";
import { patchWavHeader } from "./session/recorder";
import { newId, type Session, type SessionBrain } from "./session/session";

export interface AppDeps {
  config: Config;
  brain?: SessionBrain | null;
  speech?: { stt: SttProvider; tts: TtsProvider };
  /** Called after a session is created with its inputs (P1 extractor hooks in here). */
  onCreate?: (hub: SessionHub, sessionId: string, input: CreateInput) => Promise<void>;
}

export const CreateInput = z.object({
  mode: SessionMode.default("recruiter"),
  durationSec: z.coerce.number().int().min(60).max(3600).default(900),
  role: z.string().min(1).default("Software Engineer"),
  candidateName: z.string().optional(),
  resumeText: z.string().default(""),
  jdText: z.string().default(""),
  demo: z.coerce.boolean().default(false),
});
export type CreateInput = z.infer<typeof CreateInput>;

export async function buildApp(deps: AppDeps) {
  const { config } = deps;
  const { db } = await openDb(config.databaseUrl);
  const log = new EventLog(db);
  const hub = new SessionHub(log, deps.brain ?? null);

  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } });
  await app.register(cors, { origin: config.webOrigin });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(websocket);

  app.get("/health", async () => ({
    ok: true,
    providers: config.providers,
    llm: { gemini: !!config.llm.gemini.apiKey, openai: !!config.llm.openai.apiKey },
    elevenlabs: !!config.elevenlabs.apiKey,
  }));

  app.post("/v1/sessions", async (req, reply) => {
    let raw: Record<string, unknown> = {};
    if (req.isMultipart()) {
      for await (const part of req.parts()) {
        if (part.type === "file") {
          const buf = await part.toBuffer();
          const key = part.fieldname === "resume" ? "resumeText" : part.fieldname === "jd" ? "jdText" : part.fieldname;
          raw[key] = await fileToText(part.filename, buf);
        } else {
          const key = part.fieldname === "jd" ? "jdText" : part.fieldname === "resume" ? "resumeText" : part.fieldname;
          raw[key] = part.value;
        }
      }
    } else {
      raw = (req.body as Record<string, unknown>) ?? {};
    }
    const input = CreateInput.parse(raw);
    const id = newId("ses");
    await log.createSession(id, { mode: input.mode, role: input.role, candidateName: input.candidateName });
    const s = await hub.get(id);
    await s.emit({
      type: "SESSION_CREATED",
      payload: { mode: input.mode, durationSec: input.durationSec, role: input.role, candidateName: input.candidateName },
    });
    await deps.onCreate?.(hub, id, input);
    return reply.code(201).send({ sessionId: id });
  });

  app.get("/v1/sessions", async () => {
    const rows = await log.listSessions();
    return Promise.all(
      rows.map(async (r) => {
        const st = reduceAll(await log.read(r.id));
        return {
          id: r.id,
          createdAt: r.createdAt,
          mode: r.mode,
          role: r.role,
          candidateName: r.candidateName,
          started: st.started,
          ended: !!st.ended,
          cases: st.caseOrder.map((cid) => st.cases[cid]!).map((c) => ({ id: c.id, label: c.label, status: c.status, belief: c.belief })),
        };
      }),
    );
  });

  app.get<{ Params: { id: string } }>("/v1/sessions/:id", async (req, reply) => {
    const events = await log.read(req.params.id);
    if (!events.length) return reply.code(404).send({ error: "not_found" });
    return reduceAll(events);
  });

  app.get<{ Params: { id: string }; Querystring: { after?: string } }>("/v1/sessions/:id/events", async (req) => {
    return log.read(req.params.id, Number(req.query.after ?? 0));
  });

  app.get<{ Params: { id: string } }>("/v1/sessions/:id/verify", async (req) => {
    return verifyChain(await log.read(req.params.id));
  });

  app.get<{ Params: { id: string; track: string } }>("/v1/sessions/:id/audio/:track", async (req, reply) => {
    if (req.params.track !== "candidate" && req.params.track !== "verity") return reply.code(400).send({ error: "bad_track" });
    const path = join(process.cwd(), "data", "audio", req.params.id, `${req.params.track}.wav`);
    if (!existsSync(path)) return reply.code(404).send({ error: "no_audio" });
    patchWavHeader(path);
    const size = statSync(path).size;
    reply.header("content-type", "audio/wav");
    reply.header("accept-ranges", "bytes");
    reply.header("cache-control", "no-store");

    const range = req.headers.range;
    if (!range) {
      reply.header("content-length", size);
      return reply.send(createReadStream(path));
    }
    const parsed = parseByteRange(range, size);
    if (!parsed) {
      reply.header("content-range", `bytes */${size}`);
      return reply.code(416).send();
    }
    const { start, end } = parsed;
    reply.code(206);
    reply.header("content-range", `bytes ${start}-${end}/${size}`);
    reply.header("content-length", end - start + 1);
    return reply.send(createReadStream(path, { start, end }));
  });

  const voices = new Map<string, LiveVoice>();

  app.get<{ Params: { id: string } }>("/v1/session/:id", { websocket: true }, async (socket, req) => {
    const s = await hub.get(req.params.id);
    const send = (e: VerityEvent) => socket.readyState === 1 && socket.send(JSON.stringify(e));
    const sink: LiveSink = {
      json: (msg) => socket.readyState === 1 && socket.send(JSON.stringify(msg)),
      pcm: (pcm) => socket.readyState === 1 && socket.send(Buffer.from(pcm)),
    };
    let unsubscribe: (() => void) | null = null;
    let textMode = true;

    socket.on("message", async (data, isBinary) => {
      if (isBinary) {
        voices.get(s.id)?.write(asPcm(data));
        return;
      }
      let msg: ClientMessage;
      try {
        msg = ClientMessage.parse(JSON.parse(String(data)));
      } catch {
        socket.send(JSON.stringify({ type: "ERROR_MESSAGE", message: "invalid message" }));
        return;
      }
      try {
        switch (msg.type) {
          case "HELLO": {
            textMode = msg.textMode;
            const backlog = await log.read(s.id, msg.lastSeq ?? 0);
            let high = msg.lastSeq ?? 0;
            for (const e of backlog) {
              send(e);
              high = e.seq;
            }
            unsubscribe?.();
            unsubscribe = log.subscribe(s.id, (e) => {
              if (e.seq > high) {
                high = e.seq;
                send(e);
              }
            });
            socket.send(JSON.stringify({ type: "READY", lastSeq: high }));
            break;
          }
          case "START":
            if (!textMode) await ensureVoice(voices, deps, s, sink);
            await s.start(textMode);
            break;
          case "TEXT_ANSWER":
            await s.textAnswer(msg.text);
            break;
          case "VAD":
            voices.get(s.id)?.vad(msg.speaking);
            break;
          case "PLAYBACK":
            break;
          case "OBSERVATION":
            await s.emit({ type: "OBSERVATION", payload: { ...msg.observation, id: newId("obs") } });
            break;
          case "END":
            await s.end("user");
            await voices.get(s.id)?.close();
            voices.delete(s.id);
            break;
          default:
            break;
        }
      } catch (err) {
        req.log.error({ err }, "ws handler failed");
      }
    });
    socket.on("close", () => unsubscribe?.());
  });

  return { app, hub, log };
}

async function ensureVoice(voices: Map<string, LiveVoice>, deps: AppDeps, s: Session, sink: LiveSink) {
  if (!deps.speech) return;
  const existing = voices.get(s.id);
  if (existing) {
    existing.attach(sink);
    return;
  }
  const voice = new LiveVoice(s, deps.speech.stt, deps.speech.tts, sink);
  voices.set(s.id, voice);
  await voice.open();
}

function asPcm(data: Buffer | ArrayBuffer | Buffer[]): Uint8Array {
  if (Buffer.isBuffer(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(Buffer.concat(data));
}

function parseByteRange(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || size <= 0) return null;
  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;
  let start: number;
  let end: number;
  if (rawStart === "") {
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Number(rawEnd);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= size || end < start) return null;
  return { start, end: Math.min(end, size - 1) };
}

async function fileToText(filename: string | undefined, buf: Buffer): Promise<string> {
  const name = (filename ?? "").toLowerCase();
  if (name.endsWith(".pdf")) {
    const { extractPdfText } = await import("./ingest/pdf");
    return extractPdfText(buf);
  }
  return buf.toString("utf8");
}
