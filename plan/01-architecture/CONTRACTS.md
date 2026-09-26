# Contracts

**Source of truth: zod schemas in `packages/contracts/src/`.** This file documents them. The server, web, LLM output schemas (via `z.toJSONSchema`), and tests all import from there. Change the schema first.

Conventions: timestamps are `sessionMs` integers. IDs are prefixed (`ses_`, `case_`, `skill_`, `q_`, `seg_`, `rcpt_`, `fact_`, `obs_`).

## Domain

```ts
type Hypothesis = "owned" | "contributed" | "surface";
type Belief = { owned: number; contributed: number; surface: number };   // sums to 1

type CaseStatus =
  | "INVESTIGATING" | "SETTLED_OWNED" | "SETTLED_CONTRIBUTED" | "SETTLED_SURFACE"
  | "OPEN"          // probe budget spent, not settled
  | "UNTOUCHED";    // never asked about

interface Skill { id; name; importance: number /*0..1*/; requirement: "required" | "preferred" }

interface Case {
  id; label /* ≤ 28 chars, "Kafka · 50k ev/s" */; claim; sourceSpan /* exact resume text */;
  skillIds: string[]; technologies: string[]; metrics: string[];
  importance: number;          // role relevance × specificity
  prior: Belief; belief: Belief; provisional: boolean;
  status: CaseStatus; conflict: boolean;
  probes: number; probeBudget: number;   // default 3
  receiptIds: string[]; questionIds: string[];
  openingQuestion: string;               // precomputed fallback
}

type QuestionKind =
  "opening" | "ownership" | "mechanism" | "counterfactual" | "scaffold" | "reconcile" | "reply" | "closing";

interface Question {
  id; caseId; kind: QuestionKind; text /* one sentence, ≤ 28 words */;
  why: string;                 // plain-language reason shown on the board
  tiedPair?: [Hypothesis, Hypothesis];
  anchors: string[];           // specifics a genuine answer would likely contain (live eval only)
  branch?: "A" | "B" | "sync" | "fallback";
  committedMs; spokenStartMs?; spokenEndMs?; interruptedAtChar?;
}

interface Segment { id; speaker: "candidate" | "verity"; text; startMs; endMs; final: boolean;
  words?: { w: string; s: number; e: number }[] }

type EvidenceType = "decision" | "tradeoff" | "mechanism" | "metric" | "failure" | "ownership"
                  | "vague" | "non_answer" | "conflict";

interface Receipt {
  id; caseId; questionId; segmentIds: string[];
  quote: string;               // verbatim substring of the candidate transcript
  clip: { startMs: number; endMs: number };
  type: EvidenceType;
  likelihood: { owned: 1|2|3|4|5; contributed: 1|2|3|4|5; surface: 1|2|3|4|5 };
  rationale: string;           // one plain sentence
  before: Belief; after: Belief;
  conflictsWith?: string;      // receipt/fact id, for conflict receipts
}

interface Fact { id; caseId?; entity; attribute; value: string; unit?: string; quote; atMs }

interface Observation {
  id; kind: "FOCUS_LOST" | "FOCUS_RETURNED" | "SECOND_VOICE_POSSIBLE" | "SILENCE_THEN_FLUENT"
          | "GAZE_AWAY" | "HEAD_DOWN" | "EXTRA_FACE" | "CAMERA_OFF";
  startMs; endMs?; detail /* neutral wording */; duringQuestionId?;
}

type VoiceState = "LISTEN" | "ACK" | "SPEAK" | "YIELD";
```

## Events (append-only, hash-chained)
Envelope: `{ seq, type, sessionId, atMs, payload, prevHash, hash }`

| type | payload |
|---|---|
| `SESSION_CREATED` | `{ mode: "recruiter" \| "practice", durationSec, role }` |
| `SKILL_ADDED` / `CASE_OPENED` | `Skill` / `Case` |
| `SESSION_STARTED` | `{ textMode }` |
| `ACTIVE_CASE_CHANGED` | `{ caseId, why }` |
| `QUESTION_COMMITTED` | `Question` |
| `VERITY_AUDIO_STARTED` / `VERITY_AUDIO_ENDED` | `{ questionId }` |
| `QUESTION_INTERRUPTED` | `{ questionId, atChar }` |
| `VOICE_STATE` | `{ from, to, reason }` |
| `SEGMENT_PARTIAL` / `SEGMENT_FINAL` | `Segment` |
| `EARLY_END_OF_TURN` / `TURN_RESUMED` / `END_OF_TURN` | `{ segmentIds, text, startMs, endMs }` |
| `BELIEF_UPDATED` | `{ caseId, before, after, provisional, status, receiptIds, reason }` |
| `RECEIPT_CREATED` | `Receipt` |
| `FACT_RECORDED` | `Fact` |
| `CONFLICT_SUSPECTED` | `{ caseId, factIds: [string, string], note }` |
| `CONFLICT_RESOLVED` / `CONFLICT_CONFIRMED` | `{ caseId, receiptIds }` |
| `OBSERVATION` | `Observation` |
| `LATENCY_SAMPLE` | `{ segment, ms, questionId? }` |
| `ERROR` | `{ code, message, recoverable }` |
| `SESSION_ENDED` | `{ reason: "time" \| "done" \| "user" }` |

**Invariants** (checked after every integration test):
1. `seq` strictly increases; each `prevHash` equals the previous `hash`; the chain verifies.
2. Non-provisional `BELIEF_UPDATED` has ≥ 1 `receiptIds`; beliefs sum to 1 ± 1e-6.
3. `QUESTION_COMMITTED` precedes `VERITY_AUDIO_STARTED` for that question; no audio after its `QUESTION_INTERRUPTED`.
4. Every `Receipt.quote` is a substring of the referenced segments.
5. `CONFLICT_CONFIRMED` only after a `reconcile` question on that case and a `CONFLICT_SUSPECTED`.
6. Questions: exactly one sentence, ≤ 28 words, ≤ 1 question mark.

## WebSocket `/v1/session/:id`
Client → server JSON: `HELLO {lastSeq?, textMode}` · `START` · `TEXT_ANSWER {text}` · `VAD {speaking, clientMs}` · `PLAYBACK {questionId, event: "started"|"ended"|"ducked"|"stopped"}` · `OBSERVATION {…}` · `END`
Client → server binary: PCM16 LE mono 16 kHz, 20 ms frames.
Server → client JSON: events above + control `TTS_BEGIN {questionId, sampleRate}` · `TTS_END {questionId}` · `YIELD {questionId}` · `ACK {clip}`.
Server → client binary: `[0x01][8-byte questionId tag][PCM16 LE]`; the player drops chunks whose tag isn't current.

## HTTP (Fastify, `/v1`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/sessions` | multipart `resume` (pdf/txt/md), `jd` (file or text), `durationSec`, `mode` → `{ sessionId }` |
| GET | `/sessions/:id` | projection snapshot (skills, cases, questions, receipts, observations) |
| GET | `/sessions/:id/events?after=` | replay |
| GET | `/sessions/:id/audio/:track` | `candidate` \| `verity` WAV, HTTP Range supported |
| GET | `/sessions/:id/dossier` | computed dossier + chain verification result |
| GET | `/health` | provider status |
