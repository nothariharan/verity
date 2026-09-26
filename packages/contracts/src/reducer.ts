import type { Case, Fact, Observation, Question, Receipt, Segment, SessionMode, Skill, VoiceState } from "./domain";
import type { VerityEvent } from "./events";

export interface SessionState {
  sessionId: string | null;
  lastSeq: number;
  lastHash: string | null;
  meta: { mode: SessionMode; durationSec: number; role: string; candidateName?: string } | null;
  started: boolean;
  textMode: boolean;
  ended: { reason: string; atMs: number } | null;
  atMs: number;
  skills: Record<string, Skill>;
  skillOrder: string[];
  cases: Record<string, Case>;
  caseOrder: string[];
  activeCaseId: string | null;
  activeWhy: string | null;
  questions: Record<string, Question>;
  questionOrder: string[];
  segments: Segment[];
  partial: Segment | null;
  receipts: Record<string, Receipt>;
  receiptOrder: string[];
  facts: Fact[];
  observations: Observation[];
  voiceState: VoiceState;
  speakingQuestionId: string | null;
}

export function emptyState(): SessionState {
  return {
    sessionId: null,
    lastSeq: 0,
    lastHash: null,
    meta: null,
    started: false,
    textMode: false,
    ended: null,
    atMs: 0,
    skills: {},
    skillOrder: [],
    cases: {},
    caseOrder: [],
    activeCaseId: null,
    activeWhy: null,
    questions: {},
    questionOrder: [],
    segments: [],
    partial: null,
    receipts: {},
    receiptOrder: [],
    facts: [],
    observations: [],
    voiceState: "LISTEN",
    speakingQuestionId: null,
  };
}

/**
 * Pure projection of the event log. Events with seq ≤ lastSeq are ignored,
 * so replaying overlapping batches is safe.
 */
export function reduce(state: SessionState, e: VerityEvent): SessionState {
  if (e.seq <= state.lastSeq) return state;
  const s: SessionState = { ...state, lastSeq: e.seq, lastHash: e.hash, atMs: Math.max(state.atMs, e.atMs) };
  if (!s.sessionId) s.sessionId = e.sessionId;

  switch (e.type) {
    case "SESSION_CREATED":
      s.meta = { ...e.payload };
      break;
    case "SKILL_ADDED":
      s.skills = { ...s.skills, [e.payload.id]: e.payload };
      if (!s.skillOrder.includes(e.payload.id)) s.skillOrder = [...s.skillOrder, e.payload.id];
      break;
    case "CASE_OPENED":
      s.cases = { ...s.cases, [e.payload.id]: e.payload };
      if (!s.caseOrder.includes(e.payload.id)) s.caseOrder = [...s.caseOrder, e.payload.id];
      break;
    case "SESSION_STARTED":
      s.started = true;
      s.textMode = e.payload.textMode;
      break;
    case "ACTIVE_CASE_CHANGED":
      s.activeCaseId = e.payload.caseId;
      s.activeWhy = e.payload.why;
      break;
    case "QUESTION_COMMITTED": {
      const q = e.payload;
      s.questions = { ...s.questions, [q.id]: q };
      s.questionOrder = [...s.questionOrder, q.id];
      const c = s.cases[q.caseId];
      if (c) {
        const probes = q.kind === "opening" || q.kind === "closing" || q.kind === "reply" ? c.probes : c.probes + 1;
        s.cases = {
          ...s.cases,
          [c.id]: {
            ...c,
            probes,
            questionIds: [...c.questionIds, q.id],
            status: c.status === "UNTOUCHED" ? "INVESTIGATING" : c.status,
          },
        };
      }
      s.segments = [
        ...s.segments,
        { id: `seg_v_${q.id}`, speaker: "verity", text: q.text, startMs: e.atMs, endMs: e.atMs, final: true },
      ];
      break;
    }
    case "VERITY_AUDIO_STARTED":
      s.speakingQuestionId = e.payload.questionId;
      s.questions = patchQuestion(s.questions, e.payload.questionId, { spokenStartMs: e.atMs });
      break;
    case "VERITY_AUDIO_ENDED":
      if (s.speakingQuestionId === e.payload.questionId) s.speakingQuestionId = null;
      s.questions = patchQuestion(s.questions, e.payload.questionId, { spokenEndMs: e.atMs });
      break;
    case "QUESTION_INTERRUPTED":
      if (s.speakingQuestionId === e.payload.questionId) s.speakingQuestionId = null;
      s.questions = patchQuestion(s.questions, e.payload.questionId, { interruptedAtChar: e.payload.atChar });
      break;
    case "VOICE_STATE":
      s.voiceState = e.payload.to;
      break;
    case "SEGMENT_PARTIAL":
      s.partial = e.payload;
      break;
    case "SEGMENT_FINAL":
      s.segments = [...s.segments, e.payload];
      if (s.partial && s.partial.id === e.payload.id) s.partial = null;
      else if (s.partial && s.partial.startMs <= e.payload.endMs) s.partial = null;
      break;
    case "EARLY_END_OF_TURN":
    case "TURN_RESUMED":
    case "END_OF_TURN":
      if (e.type === "END_OF_TURN") s.partial = null;
      break;
    case "BELIEF_UPDATED": {
      const c = s.cases[e.payload.caseId];
      if (c) {
        s.cases = {
          ...s.cases,
          [c.id]: {
            ...c,
            belief: e.payload.after,
            provisional: e.payload.provisional,
            status: e.payload.status,
            receiptIds: Array.from(new Set([...c.receiptIds, ...e.payload.receiptIds])),
          },
        };
      }
      break;
    }
    case "RECEIPT_CREATED":
      s.receipts = { ...s.receipts, [e.payload.id]: e.payload };
      s.receiptOrder = [...s.receiptOrder, e.payload.id];
      break;
    case "FACT_RECORDED":
      s.facts = [...s.facts, e.payload];
      break;
    case "CONFLICT_CONFIRMED": {
      const c = s.cases[e.payload.caseId];
      if (c) s.cases = { ...s.cases, [c.id]: { ...c, conflict: true } };
      break;
    }
    case "CONFLICT_RESOLVED": {
      const c = s.cases[e.payload.caseId];
      if (c) s.cases = { ...s.cases, [c.id]: { ...c, conflict: false } };
      break;
    }
    case "OBSERVATION":
      s.observations = [...s.observations, e.payload];
      break;
    case "SESSION_ENDED":
      s.ended = { reason: e.payload.reason, atMs: e.atMs };
      s.partial = null;
      break;
    default:
      break;
  }
  return s;
}

export function reduceAll(events: readonly VerityEvent[], upToMs = Infinity): SessionState {
  let s = emptyState();
  for (const e of events) {
    if (e.atMs > upToMs) break;
    s = reduce(s, e);
  }
  return s;
}

function patchQuestion(qs: Record<string, Question>, id: string, patch: Partial<Question>) {
  const q = qs[id];
  return q ? { ...qs, [id]: { ...q, ...patch } } : qs;
}
