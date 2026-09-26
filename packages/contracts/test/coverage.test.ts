import { describe, expect, it } from "vitest";
import { depthShown, roleCoverage, type Case, type Question, type Receipt, type SessionState, type Skill } from "../src";

const belief = { owned: 0.34, contributed: 0.33, surface: 0.33 };

function skill(id: string, name: string, requirement: Skill["requirement"]): Skill {
  return { id, name, importance: 0.8, requirement };
}

function kase(over: Partial<Case> & Pick<Case, "id" | "status" | "skillIds">): Case {
  return {
    label: over.id,
    claim: "claim",
    sourceSpan: "claim",
    technologies: [],
    metrics: [],
    importance: 0.5,
    prior: belief,
    belief,
    provisional: false,
    conflict: false,
    probes: 1,
    probeBudget: 3,
    receiptIds: [],
    questionIds: [],
    openingQuestion: "What did you decide?",
    ...over,
  };
}

function state(skills: Skill[], cases: Case[]): SessionState {
  return {
    sessionId: "ses_coverage01",
    lastSeq: 1,
    lastHash: null,
    meta: null,
    started: true,
    ended: null,
    textMode: true,
    atMs: 0,
    voiceState: "LISTEN",
    activeCaseId: null,
    activeWhy: null,
    speakingQuestionId: null,
    skills: Object.fromEntries(skills.map((s) => [s.id, s])),
    skillOrder: skills.map((s) => s.id),
    cases: Object.fromEntries(cases.map((c) => [c.id, c])),
    caseOrder: cases.map((c) => c.id),
    questions: {},
    questionOrder: [],
    segments: [],
    partial: null,
    receipts: {},
    receiptOrder: [],
    facts: [],
    observations: [],
  };
}

describe("role coverage", () => {
  it("marks a required skill with no case as not claimed", () => {
    const rows = roleCoverage(state([skill("skill_cuda0001", "CUDA", "required")], []));
    expect(rows[0]).toMatchObject({ claimed: false, settled: "not_claimed", caseLabels: [] });
  });

  it("uses the strongest settled status among linked cases", () => {
    const rows = roleCoverage(
      state(
        [skill("skill_kafka01", "Kafka", "required")],
        [
          kase({ id: "case_a", status: "OPEN", skillIds: ["skill_kafka01"], label: "Open pipe" }),
          kase({ id: "case_b", status: "SETTLED_OWNED", skillIds: ["skill_kafka01"], label: "Owned pipe" }),
        ],
      ),
    );
    expect(rows[0]).toMatchObject({ claimed: true, settled: "SETTLED_OWNED", caseLabels: ["Open pipe", "Owned pipe"] });
  });
});

describe("depth", () => {
  it("is 3 only when owned and a counterfactual receipt is specific", () => {
    const question = {
      id: "q_counter001",
      caseId: "case_owned01",
      kind: "counterfactual",
      text: "What would break if the key changed?",
      why: "depth",
      anchors: [],
      branch: "sync",
      committedMs: 1,
    } satisfies Question;
    const receipt = {
      id: "rcpt_owned001",
      caseId: "case_owned01",
      questionId: question.id,
      segmentIds: ["seg_owned0001"],
      quote: "I would rehash the key",
      clip: { startMs: 0, endMs: 1000 },
      type: "decision",
      likelihood: { owned: 5, contributed: 2, surface: 1 },
      rationale: "A personal decision.",
      before: belief,
      after: belief,
    } satisfies Receipt;
    const c = kase({
      id: "case_owned01",
      status: "SETTLED_OWNED",
      skillIds: [],
      questionIds: [question.id],
      receiptIds: [receipt.id],
    });
    expect(depthShown(c, { [question.id]: question }, { [receipt.id]: receipt })).toBe(3);
    expect(depthShown({ ...c, status: "SETTLED_CONTRIBUTED" }, { [question.id]: question }, { [receipt.id]: receipt })).toBe(2);
    expect(depthShown({ ...c, status: "OPEN", questionIds: ["q_counter001"] }, { [question.id]: question }, {})).toBe(1);
    expect(depthShown({ ...c, status: "UNTOUCHED", questionIds: [] }, {}, {})).toBe(0);
  });
});
