import { describe, expect, it } from "vitest";
import { deriveStatus, guardLikelihood, prior, update } from "../../src/mind/belief";

const sum = (b: { owned: number; contributed: number; surface: number }) => b.owned + b.contributed + b.surface;

describe("belief", () => {
  it("computes the prior and keeps it on the simplex", () => {
    const crisp = prior(1, 1);
    expect(sum(crisp)).toBeCloseTo(1, 6);
    expect(crisp.owned).toBeGreaterThan(crisp.contributed);
    expect(crisp.surface).toBeLessThan(0.2);
    const vague = prior(0, 0);
    expect(vague.surface).toBeGreaterThan(vague.owned);
  });

  it("moves toward the hypothesis the evidence supports", () => {
    const before = { owned: 0.2, contributed: 0.45, surface: 0.35 };
    const after = update(before, { owned: 5, contributed: 2, surface: 1 });
    expect(sum(after)).toBeCloseTo(1, 6);
    expect(after.owned - before.owned).toBeGreaterThan(0.2);
    expect(after.surface).toBeLessThan(before.surface);
  });

  it("does not move on a non-answer", () => {
    const before = { owned: 0.3, contributed: 0.4, surface: 0.3 };
    const after = update(before, guardLikelihood("non_answer", { owned: 5, contributed: 1, surface: 1 }));
    expect(after).toEqual(before);
  });

  it("floors every hypothesis above zero", () => {
    let b = { owned: 0.8, contributed: 0.1, surface: 0.1 };
    for (let i = 0; i < 8; i++) b = update(b, { owned: 5, contributed: 1, surface: 1 });
    expect(b.surface).toBeGreaterThanOrEqual(0.029);
    expect(b.contributed).toBeGreaterThanOrEqual(0.029);
    expect(sum(b)).toBeCloseTo(1, 6);
  });

  it("settles owned at 0.70 and withholds surface until a scaffold", () => {
    expect(deriveStatus({ owned: 0.72, contributed: 0.2, surface: 0.08 }, { probes: 1, probeBudget: 3, scaffoldAsked: false, asked: true })).toBe("SETTLED_OWNED");
    expect(deriveStatus({ owned: 0.1, contributed: 0.15, surface: 0.75 }, { probes: 2, probeBudget: 3, scaffoldAsked: false, asked: true })).toBe("INVESTIGATING");
    expect(deriveStatus({ owned: 0.1, contributed: 0.15, surface: 0.75 }, { probes: 2, probeBudget: 3, scaffoldAsked: true, asked: true })).toBe("SETTLED_SURFACE");
    expect(deriveStatus({ owned: 0.3, contributed: 0.4, surface: 0.3 }, { probes: 3, probeBudget: 3, scaffoldAsked: false, asked: true })).toBe("OPEN");
  });
});
