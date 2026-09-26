import { describe, expect, it } from "vitest";
import { createTurnState, decideTurn, onPartial, onSilenceTick } from "../../src/session/turns";

describe("turns", () => {
  it("does not final a trailing because after a 2s pause", () => {
    let step = decideTurn(createTurnState(), "…because", 0);
    step = decideTurn(step.state, "…because", 2_000);
    expect(step.events).not.toContain("final");
    step = decideTurn(step.state, "…because", 3_000);
    expect(step.events).toContain("final");
  });

  it("finals a complete sentence after 800ms of silence", () => {
    let step = onPartial(createTurnState(), "I built the inverted index.", 0);
    step = onSilenceTick(step.state, 699);
    expect(step.events).not.toContain("final");
    step = onSilenceTick(step.state, 800);
    expect(step.events).toContain("final");
  });

  it("finals Yes. only after the 1.5s hold", () => {
    let step = onPartial(createTurnState(), "Yes.", 0);
    step = onSilenceTick(step.state, 700);
    expect(step.events).not.toContain("final");
    step = onSilenceTick(step.state, 1_499);
    expect(step.events).not.toContain("final");
    step = onSilenceTick(step.state, 1_500);
    expect(step.events).toContain("final");
  });

  it("fires early before final, and a new partial after early resumes and cancels the final", () => {
    let step = onPartial(createTurnState(), "I shipped the index.", 0);
    step = onSilenceTick(step.state, 400);
    expect(step.events).toEqual(["early"]);
    step = onSilenceTick(step.state, 700);
    expect(step.events).toEqual(["final"]);

    step = onPartial(createTurnState(), "I shipped the index.", 0);
    step = onSilenceTick(step.state, 400);
    expect(step.events).toEqual(["early"]);
    step = onPartial(step.state, "I shipped the index last year.", 450);
    expect(step.events).toEqual(["resumed"]);
    step = onSilenceTick(step.state, 700);
    expect(step.events).not.toContain("final");
    step = onSilenceTick(step.state, 450 + 700);
    expect(step.events[0]).toBe("early");
    expect(step.events).toContain("final");
  });

  it("keeps the 700ms base for a multi-word complete short answer", () => {
    let step = onPartial(createTurnState(), "I'm not sure.", 0);
    step = onSilenceTick(step.state, 800);
    expect(step.events).toContain("final");
    step = onPartial(createTurnState(), "I don't remember.", 0);
    step = onSilenceTick(step.state, 699);
    expect(step.events).not.toContain("final");
    step = onSilenceTick(step.state, 800);
    expect(step.events).toContain("final");
  });
});
