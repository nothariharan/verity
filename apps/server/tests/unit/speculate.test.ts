import { describe, expect, it } from "vitest";
import { pickBranch } from "../../src/mind/speculate";

describe("speculative branch", () => {
  it("picks A when the leading hypothesis jumps", () => {
    expect(pickBranch({ owned: 0.3, contributed: 0.4, surface: 0.3 }, { owned: 0.55, contributed: 0.3, surface: 0.15 })).toBe("A");
  });
  it("picks A when a hypothesis would settle", () => {
    expect(pickBranch({ owned: 0.62, contributed: 0.28, surface: 0.1 }, { owned: 0.71, contributed: 0.2, surface: 0.09 })).toBe("A");
  });
  it("picks B when the answer barely moves the belief", () => {
    expect(pickBranch({ owned: 0.34, contributed: 0.4, surface: 0.26 }, { owned: 0.36, contributed: 0.39, surface: 0.25 })).toBe("B");
  });
});