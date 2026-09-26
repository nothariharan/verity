import { z } from "zod";
import { Observation } from "./domain";

export const ClientMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("HELLO"), lastSeq: z.number().int().min(0).optional(), textMode: z.boolean() }),
  z.object({ type: z.literal("START") }),
  z.object({ type: z.literal("TEXT_ANSWER"), text: z.string().min(1).max(4000) }),
  z.object({ type: z.literal("VAD"), speaking: z.boolean(), clientMs: z.number() }),
  z.object({
    type: z.literal("PLAYBACK"),
    questionId: z.string(),
    event: z.enum(["started", "ended", "ducked", "stopped"]),
  }),
  z.object({ type: z.literal("OBSERVATION"), observation: Observation.omit({ id: true }) }),
  z.object({ type: z.literal("END") }),
]);
export type ClientMessage = z.infer<typeof ClientMessage>;

export const ControlMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("TTS_BEGIN"), questionId: z.string(), sampleRate: z.number().int() }),
  z.object({ type: z.literal("TTS_END"), questionId: z.string() }),
  z.object({ type: z.literal("YIELD"), questionId: z.string() }),
  z.object({ type: z.literal("ACK"), clip: z.string() }),
  z.object({ type: z.literal("READY"), lastSeq: z.number().int().min(0) }),
]);
export type ControlMessage = z.infer<typeof ControlMessage>;
