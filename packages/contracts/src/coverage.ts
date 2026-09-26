import type { Case, CaseStatus, Question, Receipt, Skill } from "./domain";
import type { SessionState } from "./reducer";

const RANK: Record<CaseStatus, number> = {
  UNTOUCHED: 0,
  INVESTIGATING: 1,
  OPEN: 2,
  SETTLED_SURFACE: 3,
  SETTLED_CONTRIBUTED: 4,
  SETTLED_OWNED: 5,
};

export type CoverageRow = {
  skill: Skill;
  claimed: boolean;
  caseLabels: string[];
  settled: CaseStatus | "not_claimed";
};

/** Required → claimed (linked cases) → best settled status. Skills with no case are not claimed. */
export function roleCoverage(s: SessionState): CoverageRow[] {
  const cases = Object.values(s.cases);
  return Object.values(s.skills)
    .slice()
    .sort((a, b) => Number(b.requirement === "required") - Number(a.requirement === "required") || b.importance - a.importance || a.name.localeCompare(b.name))
    .map((skill) => {
      const linked = cases.filter((c) => c.skillIds.includes(skill.id));
      if (!linked.length) return { skill, claimed: false, caseLabels: [], settled: "not_claimed" as const };
      const best = linked.reduce((a, c) => (RANK[c.status] > RANK[a.status] ? c : a));
      return { skill, claimed: true, caseLabels: linked.map((c) => c.label), settled: best.status };
    });
}

/**
 * Depth shown in this interview.
 * 0 untouched · 1 surface or open · 2 contributed, or owned without a strong counterfactual · 3 owned and a strong counterfactual.
 */
export function depthShown(c: Case, questions: Record<string, Question>, receipts: Record<string, Receipt>): 0 | 1 | 2 | 3 {
  if (c.status === "UNTOUCHED" || c.questionIds.length === 0) return 0;
  const counterfactual = c.questionIds.some((id) => questions[id]?.kind === "counterfactual");
  const strong =
    counterfactual &&
    c.receiptIds.some((id) => {
      const receipt = receipts[id];
      return !!receipt && receipt.type !== "vague" && receipt.type !== "non_answer" && questions[receipt.questionId]?.kind === "counterfactual";
    });
  if (c.status === "SETTLED_OWNED" && strong) return 3;
  if (c.status === "SETTLED_OWNED" || c.status === "SETTLED_CONTRIBUTED") return 2;
  return 1;
}
