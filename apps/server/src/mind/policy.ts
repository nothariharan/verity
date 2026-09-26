import type { Belief, Case, Hypothesis, QuestionKind, SessionState } from "@verity/contracts";
import { entropy01, SETTLE, topTwo } from "./belief";

export const ARC = { normalUntilMs: 150_000, replyAtMs: 90_000, closingAtMs: 20_000 } as const;

export const GREETING =
  "Hi, I'm Verity, and I'll ask about a few things on your resume, one at a time.";
export const CLOSING_TEXT = "That's all my questions, thank you for walking me through your work, and the hiring team will follow up with next steps.";

export interface CaseMemo {
  scaffoldAsked: boolean;
  counterfactualAsked: boolean;
  lastEvidence?: string;
  conflictSuspected?: boolean;
}

export interface Plan {
  caseId: string;
  kind: QuestionKind;
  why: string;
  tiedPair?: [Hypothesis, Hypothesis];
}

const HYP = { owned: "Owned", contributed: "Contributed", surface: "Surface" } as const;
const pct = (n: number) => n.toFixed(2);

function settled(c: Case) {
  return c.status.startsWith("SETTLED");
}

export function caseValue(c: Case, memo: CaseMemo, ctx: { activeId: string | null; remainingMs: number }): number {
  const active = c.id === ctx.activeId;
  const fatigue = c.probes < c.probeBudget ? 1 : 0;
  if (fatigue === 0) return 0;
  if (settled(c)) {
    const cfOk = c.belief.owned >= SETTLE && c.importance >= 0.8 && !memo.counterfactualAsked;
    if (!cfOk) return 0;
    return c.importance * 0.35 * (active ? 1.2 : 1);
  }
  const uncertainty = entropy01(c.belief);
  const timeFit = ctx.remainingMs >= ARC.normalUntilMs ? 1 : active ? 1 : 0.2;
  const continuity = active && (memo.lastEvidence === "vague" || memo.lastEvidence === "non_answer") ? 1.3 : 1;
  const conflictBoost = memo.conflictSuspected ? 1.6 : 1;
  return c.importance * uncertainty * timeFit * fatigue * continuity * conflictBoost;
}

export function chooseKind(c: Case, memo: CaseMemo): { kind: QuestionKind; tiedPair?: [Hypothesis, Hypothesis] } {
  if (c.questionIds.length === 0) return { kind: "opening" };
  if (memo.conflictSuspected) return { kind: "reconcile" };
  const [a, b] = topTwo(c.belief);
  if (a === "surface" && !memo.scaffoldAsked) return { kind: "scaffold", tiedPair: [a, b] };
  if (c.belief.owned >= 0.6) return { kind: "counterfactual" };
  if ((a === "owned" && b === "contributed") || (a === "contributed" && b === "owned")) return { kind: "ownership", tiedPair: [a, b] };
  return { kind: "mechanism", tiedPair: [a, b] };
}

export function whyString(c: Case, kind: QuestionKind, tied?: [Hypothesis, Hypothesis], opts: { continuing?: boolean } = {}): string {
  const b: Belief = c.belief;
  const imp = c.importance >= 0.75 ? "high role importance" : c.importance >= 0.5 ? "relevant to the role" : "lower role importance";
  switch (kind) {
    case "opening":
      return `${c.label}: ${imp}; not yet explored, so start with a concrete detail.`;
    case "counterfactual":
      return `${c.label}: Owned is leading (${pct(b.owned)}); a what-if checks how deep the understanding goes.`;
    case "scaffold":
      return `${c.label}: Surface is leading (${pct(b.surface)}); ask a narrower, easier question before concluding anything.`;
    case "reconcile":
      return `${c.label}: two statements don't obviously fit together; ask neutrally how they reconcile.`;
    case "reply":
      return `${c.label}: still open near the end; give the candidate a chance to add anything.`;
    case "closing":
      return "Time is nearly up.";
    default: {
      const [x, y] = tied ?? topTwo(b);
      const lead = opts.continuing ? "last answer was vague; " : "";
      return `${c.label}: ${lead}${HYP[x]} vs ${HYP[y]} still close (${pct(b[x])} / ${pct(b[y])}).`;
    }
  }
}

/**
 * Picks the next case and question kind. Returns "closing" when time is nearly up
 * and null when nothing is worth asking (session should close).
 */
export function plan(s: SessionState, memos: Map<string, CaseMemo>, nowMs: number, flags: { replyAsked: boolean; closingAsked: boolean }): Plan | { kind: "closing" } | null {
  const duration = (s.meta?.durationSec ?? 900) * 1000;
  const remaining = duration - nowMs;
  const cases = s.caseOrder.map((id) => s.cases[id]!);

  if (remaining <= ARC.closingAtMs && !flags.closingAsked) return { kind: "closing" };

  if (remaining <= ARC.replyAtMs && !flags.replyAsked) {
    const target = cases
      .filter((c) => c.status === "OPEN" || c.status === "INVESTIGATING")
      .sort((a, z) => z.importance - a.importance)[0];
    if (target) return { caseId: target.id, kind: "reply", why: whyString(target, "reply") };
  }

  const memo = (id: string) => memos.get(id) ?? { scaffoldAsked: false, counterfactualAsked: false };
  const ranked = cases
    .map((c) => ({ c, v: caseValue(c, memo(c.id), { activeId: s.activeCaseId, remainingMs: remaining }) }))
    .filter((x) => x.v > 0)
    .sort((a, z) => z.v - a.v || z.c.importance - a.c.importance || a.c.id.localeCompare(z.c.id));
  const best = ranked[0];
  if (!best) return remaining > ARC.closingAtMs && !flags.closingAsked ? { kind: "closing" } : null;

  const c = best.c;
  const m = memo(c.id);
  const { kind, tiedPair } = settled(c) ? { kind: "counterfactual" as const, tiedPair: undefined } : chooseKind(c, m);
  const continuing = c.id === s.activeCaseId && (m.lastEvidence === "vague" || m.lastEvidence === "non_answer");
  return { caseId: c.id, kind, tiedPair, why: whyString(c, kind, tiedPair, { continuing }) };
}
