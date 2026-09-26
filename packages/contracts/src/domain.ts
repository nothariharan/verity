import { z } from "zod";

export const Hypothesis = z.enum(["owned", "contributed", "surface"]);
export type Hypothesis = z.infer<typeof Hypothesis>;

const prob = z.number().min(0).max(1);

export const Belief = z
  .object({ owned: prob, contributed: prob, surface: prob })
  .refine((b) => Math.abs(b.owned + b.contributed + b.surface - 1) <= 1e-6, {
    message: "belief must sum to 1",
  });
export type Belief = z.infer<typeof Belief>;

export const CaseStatus = z.enum([
  "INVESTIGATING",
  "SETTLED_OWNED",
  "SETTLED_CONTRIBUTED",
  "SETTLED_SURFACE",
  "OPEN",
  "UNTOUCHED",
]);
export type CaseStatus = z.infer<typeof CaseStatus>;

export const Skill = z.object({
  id: z.string().startsWith("skill_"),
  name: z.string().min(1),
  importance: prob,
  requirement: z.enum(["required", "preferred"]),
});
export type Skill = z.infer<typeof Skill>;

export const Case = z.object({
  id: z.string().startsWith("case_"),
  label: z.string().min(1).max(28),
  claim: z.string().min(1),
  sourceSpan: z.string(),
  skillIds: z.array(z.string()),
  technologies: z.array(z.string()),
  metrics: z.array(z.string()),
  importance: prob,
  prior: Belief,
  belief: Belief,
  provisional: z.boolean(),
  status: CaseStatus,
  conflict: z.boolean(),
  probes: z.number().int().min(0),
  probeBudget: z.number().int().min(1),
  receiptIds: z.array(z.string()),
  questionIds: z.array(z.string()),
  openingQuestion: z.string(),
});
export type Case = z.infer<typeof Case>;

export const QuestionKind = z.enum([
  "opening",
  "ownership",
  "mechanism",
  "counterfactual",
  "scaffold",
  "reconcile",
  "reply",
  "closing",
]);
export type QuestionKind = z.infer<typeof QuestionKind>;

export const MAX_QUESTION_WORDS = 28;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Invariant 6: one sentence, ≤ 28 words, ≤ 1 question mark. */
export function isValidQuestionText(text: string): boolean {
  const t = text.trim();
  if (!t || wordCount(t) > MAX_QUESTION_WORDS) return false;
  if ((t.match(/\?/g) ?? []).length > 1) return false;
  const terminators = t.replace(/[.?!]+$/, "").match(/[.?!]\s+[A-Z]/g);
  return !terminators;
}

export const QuestionText = z
  .string()
  .refine(isValidQuestionText, { message: "question must be one sentence, ≤ 28 words, ≤ 1 '?'" });

export const Question = z.object({
  id: z.string().startsWith("q_"),
  caseId: z.string(),
  kind: QuestionKind,
  text: QuestionText,
  why: z.string(),
  tiedPair: z.tuple([Hypothesis, Hypothesis]).optional(),
  anchors: z.array(z.string()),
  branch: z.enum(["A", "B", "sync", "fallback"]).optional(),
  committedMs: z.number().int().min(0),
  spokenStartMs: z.number().int().optional(),
  spokenEndMs: z.number().int().optional(),
  interruptedAtChar: z.number().int().optional(),
});
export type Question = z.infer<typeof Question>;

export const Word = z.object({ w: z.string(), s: z.number(), e: z.number() });

export const Segment = z.object({
  id: z.string().startsWith("seg_"),
  speaker: z.enum(["candidate", "verity"]),
  text: z.string(),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  final: z.boolean(),
  words: z.array(Word).optional(),
});
export type Segment = z.infer<typeof Segment>;

export const EvidenceType = z.enum([
  "decision",
  "tradeoff",
  "mechanism",
  "metric",
  "failure",
  "ownership",
  "vague",
  "non_answer",
  "conflict",
]);
export type EvidenceType = z.infer<typeof EvidenceType>;

export const Rating = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
export type Rating = z.infer<typeof Rating>;

export const Likelihood = z.object({ owned: Rating, contributed: Rating, surface: Rating });
export type Likelihood = z.infer<typeof Likelihood>;

export const Receipt = z.object({
  id: z.string().startsWith("rcpt_"),
  caseId: z.string(),
  questionId: z.string(),
  segmentIds: z.array(z.string()).min(1),
  quote: z.string().min(1),
  clip: z.object({ startMs: z.number().int().min(0), endMs: z.number().int().min(0) }),
  type: EvidenceType,
  likelihood: Likelihood,
  rationale: z.string(),
  before: Belief,
  after: Belief,
  conflictsWith: z.string().optional(),
});
export type Receipt = z.infer<typeof Receipt>;

export const Fact = z.object({
  id: z.string().startsWith("fact_"),
  caseId: z.string().optional(),
  entity: z.string(),
  attribute: z.string(),
  value: z.string(),
  unit: z.string().optional(),
  quote: z.string(),
  atMs: z.number().int().min(0),
});
export type Fact = z.infer<typeof Fact>;

export const ObservationKind = z.enum([
  "FOCUS_LOST",
  "FOCUS_RETURNED",
  "SECOND_VOICE_POSSIBLE",
  "SILENCE_THEN_FLUENT",
  "GAZE_AWAY",
  "HEAD_DOWN",
  "EXTRA_FACE",
  "CAMERA_OFF",
  "VIRTUAL_AUDIO_DEVICE",
  "VIRTUAL_CAMERA",
]);
export type ObservationKind = z.infer<typeof ObservationKind>;

export const Observation = z.object({
  id: z.string().startsWith("obs_"),
  kind: ObservationKind,
  startMs: z.number().int().min(0),
  endMs: z.number().int().optional(),
  detail: z.string(),
  duringQuestionId: z.string().optional(),
});
export type Observation = z.infer<typeof Observation>;

export const VoiceState = z.enum(["LISTEN", "ACK", "SPEAK", "YIELD"]);
export type VoiceState = z.infer<typeof VoiceState>;

export const SessionMode = z.enum(["recruiter", "practice"]);
export type SessionMode = z.infer<typeof SessionMode>;
