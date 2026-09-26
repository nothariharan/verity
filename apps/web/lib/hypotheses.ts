import type { Belief, CaseStatus, Hypothesis } from "@verity/contracts";

export const HYP_COLOR: Record<Hypothesis, string> = {
  owned: "var(--owned)",
  contributed: "var(--contributed)",
  surface: "var(--surface)",
};

export const HYP_LABEL: Record<Hypothesis, string> = {
  owned: "Owned",
  contributed: "Contributed",
  surface: "Surface",
};

export const HYP_BLURB: Record<Hypothesis | "open", string> = {
  owned: "Built or owned it. Explains decisions, trade-offs, and what broke.",
  contributed: "Worked on part of it, or used it inside someone else's design. A respectable outcome.",
  surface: "Knows the vocabulary. The interview didn't surface the work behind it.",
  open: "The questions ran out before the evidence did. Worth a follow-up.",
};

export const STATUS_LABEL: Record<CaseStatus, string> = {
  INVESTIGATING: "Investigating",
  SETTLED_OWNED: "Owned",
  SETTLED_CONTRIBUTED: "Contributed",
  SETTLED_SURFACE: "Surface",
  OPEN: "Open",
  UNTOUCHED: "Not yet asked",
};

export const STATUS_COLOR: Record<CaseStatus, string> = {
  INVESTIGATING: "var(--ink)",
  SETTLED_OWNED: "var(--owned)",
  SETTLED_CONTRIBUTED: "var(--contributed)",
  SETTLED_SURFACE: "var(--surface)",
  OPEN: "var(--open)",
  UNTOUCHED: "var(--line-strong)",
};

export function leading(b: Belief): Hypothesis {
  return (Object.entries(b) as [Hypothesis, number][]).sort((a, z) => z[1] - a[1])[0]![0];
}
