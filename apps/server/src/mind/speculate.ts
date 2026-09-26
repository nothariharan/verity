import type { Belief, Hypothesis } from "@verity/contracts";

export type Branch = "A" | "B";

/**
 * Draft A assumes the answer was strong (provisional top rose, or the case would settle).
 * Draft B assumes it was not. Nothing here is spoken; the parent commits one branch at end of turn.
 */
export function pickBranch(before: Belief, provisional: Belief): Branch {
  const top = (b: Belief): Hypothesis =>
    (["owned", "contributed", "surface"] as const).reduce((a, h) => (b[h] > b[a] ? h : a), "owned");
  const lead = top(provisional);
  const rose = provisional[lead] - before[lead];
  if (provisional[lead] >= 0.7 || rose >= 0.1) return "A";
  return "B";
}
