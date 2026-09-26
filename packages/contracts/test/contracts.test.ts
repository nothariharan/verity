import { describe, expect, it } from "vitest";
import { Belief, ClientMessage, emptyState, isValidQuestionText, reduce, VerityEvent, type VerityEvent as Ev } from "../src";

const ev = (seq: number, type: Ev["type"], payload: unknown, atMs = seq * 10): Ev =>
  ({ seq, type, payload, atMs, sessionId: "ses_test", prevHash: "p", hash: `h${seq}` }) as Ev;

const belief = { owned: 0.2, contributed: 0.45, surface: 0.35 };
const kafka = {
  id: "case_kafka",
  label: "Kafka · 50k ev/s",
  claim: "Built a Kafka pipeline handling 50k events/s",
  sourceSpan: "Built a Kafka pipeline handling 50k events/s",
  skillIds: [],
  technologies: ["Kafka"],
  metrics: ["50k events/s"],
  importance: 0.8,
  prior: belief,
  belief,
  provisional: false,
  status: "UNTOUCHED",
  conflict: false,
  probes: 0,
  probeBudget: 3,
  receiptIds: [],
  questionIds: [],
  openingQuestion: "Walk me through the Kafka pipeline.",
};

describe("question text invariant", () => {
  it("accepts one short sentence", () => {
    expect(isValidQuestionText("How did you choose the partition key for that topic?")).toBe(true);
  });
  it("rejects two sentences", () => {
    expect(isValidQuestionText("Nice work. How did you partition it?")).toBe(false);
  });
  it("rejects two question marks", () => {
    expect(isValidQuestionText("Why Kafka? Why not SQS?")).toBe(false);
  });
  it("rejects > 28 words", () => {
    expect(isValidQuestionText(Array(29).fill("word").join(" ") + "?")).toBe(false);
  });
});

describe("belief", () => {
  it("must sum to 1", () => {
    expect(Belief.safeParse(belief).success).toBe(true);
    expect(Belief.safeParse({ owned: 0.5, contributed: 0.5, surface: 0.5 }).success).toBe(false);
  });
});

describe("event envelope", () => {
  it("validates payload by type", () => {
    expect(VerityEvent.safeParse(ev(1, "CASE_OPENED", kafka)).success).toBe(true);
    expect(VerityEvent.safeParse(ev(1, "CASE_OPENED", { id: "nope" })).success).toBe(false);
  });
  it("parses client messages", () => {
    expect(ClientMessage.safeParse({ type: "HELLO", lastSeq: 3, textMode: true }).success).toBe(true);
    expect(ClientMessage.safeParse({ type: "TEXT_ANSWER", text: "" }).success).toBe(false);
  });
});

describe("reducer", () => {
  it("applies a fixture and ignores duplicate seqs", () => {
    const after = { owned: 0.62, contributed: 0.3, surface: 0.08 };
    const events = [
      ev(1, "SESSION_CREATED", { mode: "recruiter", durationSec: 900, role: "ML Engineer" }),
      ev(2, "CASE_OPENED", kafka),
      ev(3, "QUESTION_COMMITTED", {
        id: "q_1",
        caseId: "case_kafka",
        kind: "ownership",
        text: "Which part of the pipeline did you design yourself?",
        why: "owned vs contributed tied",
        anchors: [],
        committedMs: 30,
      }),
      ev(4, "BELIEF_UPDATED", {
        caseId: "case_kafka",
        before: belief,
        after,
        provisional: false,
        status: "INVESTIGATING",
        receiptIds: ["rcpt_1"],
        reason: "specific decision",
      }),
    ];
    let s = emptyState();
    for (const e of events) s = reduce(s, e);
    const again = reduce(s, events[1]!);
    expect(again).toBe(s);
    expect(s.lastSeq).toBe(4);
    expect(s.cases.case_kafka!.belief).toEqual(after);
    expect(s.cases.case_kafka!.probes).toBe(1);
    expect(s.cases.case_kafka!.status).toBe("INVESTIGATING");
    expect(s.segments.at(-1)!.speaker).toBe("verity");
  });
});
