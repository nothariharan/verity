import { describe, expect, it } from "vitest";
import type { Case } from "@verity/contracts";
import { caseValue } from "../../src/mind/policy";

const belief = { owned: 0.34, contributed: 0.33, surface: 0.33 };

function kase(probes: number): Case {
  return {
    id: "case_policy001",
    label: "Kafka pipe",
    claim: "Designed a Kafka pipeline",
    sourceSpan: "Designed a Kafka pipeline",
    skillIds: [],
    technologies: [],
    metrics: [],
    importance: 0.8,
    prior: belief,
    belief,
    provisional: false,
    status: "INVESTIGATING",
    conflict: false,
    probes,
    probeBudget: 3,
    receiptIds: [],
    questionIds: ["q_policy0001"],
    openingQuestion: "What did you decide?",
  };
}

const memo = { scaffoldAsked: false, counterfactualAsked: false };

describe("case value fatigue", () => {
  it("is zero once the probe budget is spent", () => {
    expect(caseValue(kase(3), memo, { activeId: null, remainingMs: 400_000 })).toBe(0);
  });

  it("stays positive while probes remain", () => {
    expect(caseValue(kase(2), memo, { activeId: null, remainingMs: 400_000 })).toBeGreaterThan(0);
  });
});
