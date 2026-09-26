import type { Belief, CaseStatus, EvidenceType, Hypothesis, Likelihood } from "@verity/contracts";

export const LAMBDA = 0.6;
export const ETA_FINAL = 0.8;
export const ETA_PROVISIONAL = 0.5;
export const FLOOR = 0.03;
export const SETTLE = 0.7;
export const HYPS: Hypothesis[] = ["owned", "contributed", "surface"];

export function normalize(b: Belief): Belief {
  const s = b.owned + b.contributed + b.surface;
  const out = { owned: b.owned / s, contributed: b.contributed / s, surface: b.surface / s };
  // make the sum exactly 1 (floating error lands on the largest component)
  const top = HYPS.reduce((a, h) => (out[h] > out[a] ? h : a), "owned" as Hypothesis);
  out[top] = 1 - HYPS.filter((h) => h !== top).reduce((acc, h) => acc + out[h], 0);
  return out;
}

function floorAll(b: Belief, floor = FLOOR): Belief {
  // iterative: raising one to the floor shrinks the others; two passes is enough for 3 hypotheses
  let x = normalize(b);
  for (let i = 0; i < 3; i++) {
    const low = HYPS.filter((h) => x[h] < floor);
    if (!low.length) break;
    const free = 1 - low.length * floor;
    const restSum = HYPS.filter((h) => !low.includes(h)).reduce((a, h) => a + x[h], 0);
    const next = { ...x };
    for (const h of HYPS) next[h] = low.includes(h) ? floor : (x[h] / restSum) * free;
    x = next;
  }
  return normalize(x);
}

export function prior(specificity: number, ownershipLanguage: number): Belief {
  const s = clamp01(specificity);
  const o = clamp01(ownershipLanguage);
  let owned = 0.2 + 0.25 * s + 0.1 * o;
  let surface = 0.35 - 0.25 * s;
  let contributed = 1 - owned - surface;
  owned = Math.max(0.1, owned);
  surface = Math.max(0.1, surface);
  contributed = Math.max(0.1, contributed);
  return normalize({ owned, contributed, surface });
}

/** Fairness guard: non-answers are capped at 3 for every hypothesis, so they move nothing. */
export function guardLikelihood(type: EvidenceType, l: Likelihood): Likelihood {
  if (type === "non_answer") return { owned: 3, contributed: 3, surface: 3 };
  return l;
}

export function update(b: Belief, l: Likelihood, eta: number = ETA_FINAL): Belief {
  const w = (r: number) => Math.exp(LAMBDA * (r - 3));
  const post = normalize({ owned: b.owned * w(l.owned), contributed: b.contributed * w(l.contributed), surface: b.surface * w(l.surface) });
  const mixed = {
    owned: (1 - eta) * b.owned + eta * post.owned,
    contributed: (1 - eta) * b.contributed + eta * post.contributed,
    surface: (1 - eta) * b.surface + eta * post.surface,
  };
  return floorAll(mixed);
}

export function leading(b: Belief): Hypothesis {
  return HYPS.reduce((a, h) => (b[h] > b[a] ? h : a), "owned" as Hypothesis);
}

export function topTwo(b: Belief): [Hypothesis, Hypothesis] {
  const s = [...HYPS].sort((a, z) => b[z] - b[a]);
  return [s[0]!, s[1]!];
}

export function entropy01(b: Belief): number {
  const e = -HYPS.reduce((a, h) => a + (b[h] > 0 ? b[h] * Math.log(b[h]) : 0), 0);
  return e / Math.log(3);
}

export function deriveStatus(
  b: Belief,
  c: { probes: number; probeBudget: number; scaffoldAsked: boolean; asked: boolean },
): CaseStatus {
  if (!c.asked) return "UNTOUCHED";
  if (b.owned >= SETTLE) return "SETTLED_OWNED";
  if (b.contributed >= SETTLE) return "SETTLED_CONTRIBUTED";
  if (b.surface >= SETTLE && c.scaffoldAsked) return "SETTLED_SURFACE";
  if (c.probes >= c.probeBudget) return "OPEN";
  return "INVESTIGATING";
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}
