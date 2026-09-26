import { z } from "zod";
import {
  Belief,
  Case,
  CaseStatus,
  Fact,
  Observation,
  Question,
  Receipt,
  Segment,
  SessionMode,
  Skill,
  VoiceState,
} from "./domain";

const TurnPayload = z.object({
  segmentIds: z.array(z.string()),
  text: z.string(),
  startMs: z.number().int(),
  endMs: z.number().int(),
});

/** Payload schema per event type. Adding an event = add it here + CONTRACTS.md. */
export const EventPayloads = {
  SESSION_CREATED: z.object({
    mode: SessionMode,
    durationSec: z.number().int().positive(),
    role: z.string(),
    candidateName: z.string().optional(),
  }),
  SKILL_ADDED: Skill,
  CASE_OPENED: Case,
  SESSION_STARTED: z.object({ textMode: z.boolean() }),
  ACTIVE_CASE_CHANGED: z.object({ caseId: z.string(), why: z.string() }),
  QUESTION_COMMITTED: Question,
  VERITY_AUDIO_STARTED: z.object({ questionId: z.string() }),
  VERITY_AUDIO_ENDED: z.object({ questionId: z.string() }),
  QUESTION_INTERRUPTED: z.object({ questionId: z.string(), atChar: z.number().int().min(0) }),
  VOICE_STATE: z.object({ from: VoiceState, to: VoiceState, reason: z.string() }),
  SEGMENT_PARTIAL: Segment,
  SEGMENT_FINAL: Segment,
  EARLY_END_OF_TURN: TurnPayload,
  TURN_RESUMED: TurnPayload,
  END_OF_TURN: TurnPayload,
  BELIEF_UPDATED: z.object({
    caseId: z.string(),
    before: Belief,
    after: Belief,
    provisional: z.boolean(),
    status: CaseStatus,
    receiptIds: z.array(z.string()),
    reason: z.string(),
  }),
  RECEIPT_CREATED: Receipt,
  FACT_RECORDED: Fact,
  CONFLICT_SUSPECTED: z.object({
    caseId: z.string(),
    factIds: z.tuple([z.string(), z.string()]),
    note: z.string(),
  }),
  CONFLICT_RESOLVED: z.object({ caseId: z.string(), receiptIds: z.array(z.string()) }),
  CONFLICT_CONFIRMED: z.object({ caseId: z.string(), receiptIds: z.array(z.string()).min(2) }),
  OBSERVATION: Observation,
  LATENCY_SAMPLE: z.object({
    segment: z.string(),
    ms: z.number(),
    questionId: z.string().optional(),
  }),
  ERROR: z.object({ code: z.string(), message: z.string(), recoverable: z.boolean() }),
  SESSION_ENDED: z.object({ reason: z.enum(["time", "done", "user"]) }),
} as const;

export type EventType = keyof typeof EventPayloads;
export const EventType = z.enum(Object.keys(EventPayloads) as [EventType, ...EventType[]]);

export type EventPayload<T extends EventType> = z.infer<(typeof EventPayloads)[T]>;

const envelopeBase = {
  seq: z.number().int().min(1),
  sessionId: z.string().startsWith("ses_"),
  atMs: z.number().int().min(0),
  prevHash: z.string(),
  hash: z.string(),
};

function envelopeFor<T extends EventType>(type: T) {
  return z.object({ ...envelopeBase, type: z.literal(type), payload: EventPayloads[type] });
}

const variants = (Object.keys(EventPayloads) as EventType[]).map((t) => envelopeFor(t));

export const VerityEvent = z.discriminatedUnion(
  "type",
  variants as unknown as [ReturnType<typeof envelopeFor>, ...ReturnType<typeof envelopeFor>[]],
);

export type VerityEvent = {
  [T in EventType]: {
    seq: number;
    sessionId: string;
    atMs: number;
    prevHash: string;
    hash: string;
    type: T;
    payload: EventPayload<T>;
  };
}[EventType];

/** An event before the log assigns seq and hashes. */
export type NewEvent = {
  [T in EventType]: { type: T; atMs: number; payload: EventPayload<T> };
}[EventType];

export const GENESIS_HASH = "0".repeat(64);
