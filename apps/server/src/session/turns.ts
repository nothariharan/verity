/** Our endpointing. Scribe VAD is not the turn signal (VOICE_SPEC §2, ADR-016). */

export type TurnEvent = "early" | "resumed" | "final";

export interface TurnState {
  text: string;
  /** When `text` last changed. Null until the first partial. */
  changedAtMs: number | null;
  phase: "idle" | "listening" | "early" | "final";
}

export interface TurnDecision {
  events: TurnEvent[];
  state: TurnState;
}

const BASE_MS = 700;
const EARLY_LEAD_MS = 300;
const CONNECTIVE_HOLD_MS = 3000;
const SHORT_HOLD_MS = 1500;
/** A long answer with no sentence ending is still in progress. Wait before cutting it. */
const OPEN_HOLD_MS = 2000;

/** Longest first so "i mean" wins over a shorter tail. */
const CONNECTIVES = ["i mean", "basically", "because", "and", "so", "but", "then", "which", "like", "um", "uh"];

export function createTurnState(): TurnState {
  return { text: "", changedAtMs: null, phase: "idle" };
}

/**
 * Parent entry. A changed partial resets the silence clock; the same text is a silence tick.
 */
export function decideTurn(state: TurnState, partialText: string, nowMs: number): TurnDecision {
  if (partialText !== state.text) return onPartial(state, partialText, nowMs);
  return onSilenceTick(state, nowMs);
}

export function onPartial(state: TurnState, text: string, nowMs: number): TurnDecision {
  if (text === state.text) return onSilenceTick(state, nowMs);
  const events: TurnEvent[] = [];
  if (state.phase === "early") events.push("resumed");
  return {
    events,
    state: { text, changedAtMs: nowMs, phase: "listening" },
  };
}

export function onSilenceTick(state: TurnState, nowMs: number): TurnDecision {
  if (state.phase === "final" || state.phase === "idle" || state.changedAtMs === null) {
    return { events: [], state };
  }
  const silence = nowMs - state.changedAtMs;
  if (silence < 0 || !normalizeUtterance(state.text)) return { events: [], state };

  const endpoint = endpointSilenceMs(state.text);
  const earlyAt = endpoint - EARLY_LEAD_MS;
  const events: TurnEvent[] = [];
  let phase: TurnState["phase"] = state.phase;
  if (phase === "listening" && silence >= earlyAt) {
    events.push("early");
    phase = "early";
  }
  if (silence >= endpoint) {
    events.push("final");
    phase = "final";
  }
  if (phase === state.phase) return { events, state };
  return { events, state: { ...state, phase } };
}

/**
 * Silence required before final.
 * Trailing connective/filler holds up to 3s.
 * Under 3 words holds 1.5s, including "Yes." and "No." (voice script V3).
 * "I'm not sure" and "I don't remember" are 3 words, so they keep the 700ms base.
 * A longer answer that has not reached a sentence ending holds 2s, so a breath
 * or a filler ("like", "so") does not start the next question.
 */
function endpointSilenceMs(text: string): number {
  const norm = normalizeUtterance(text);
  if (!norm) return BASE_MS;
  if (endsWithConnective(norm)) return CONNECTIVE_HOLD_MS;
  if (countWords(norm) < 3) return SHORT_HOLD_MS;
  if (!/[.?!]["']?$/.test(text.trim())) return OPEN_HOLD_MS;
  return BASE_MS;
}

function endsWithConnective(norm: string): boolean {
  return CONNECTIVES.some((phrase) => norm === phrase || norm.endsWith(` ${phrase}`));
}

function countWords(norm: string): number {
  return norm ? norm.split(" ").length : 0;
}

function normalizeUtterance(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
