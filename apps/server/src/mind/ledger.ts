import type { Fact } from "@verity/contracts";

/** A suspicion only. The caller emits CONFLICT_SUSPECTED and may ask a reconcile question. */
export interface ConflictSuspicion {
  factIds: [string, string];
  note: string;
}

const TIME_TO_MS: Record<string, number> = {
  ms: 1,
  millisecond: 1,
  milliseconds: 1,
  s: 1000,
  second: 1000,
  seconds: 1000,
};

const SCALE: Record<string, number> = {
  k: 1000,
  thousand: 1000,
  thousands: 1000,
};

type Family = "none" | "time" | "scale" | "other";

interface Quantity {
  forgetting: boolean;
  numeric: number | null;
  family: Family;
  factor: number;
  unitLabel: string;
  text: string;
}

function squash(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function lookup(table: Record<string, number>, label: string): number | undefined {
  return Object.hasOwn(table, label) ? table[label] : undefined;
}

/** "I don't remember" is not a claim, so it never conflicts. */
function isForgetting(value: string): boolean {
  const v = squash(value).toLowerCase().replace(/[’‘]/g, "'");
  return v.includes("don't remember") || v.includes("dont remember") || v.includes("do not remember");
}

function pureNumber(value: string): string | null {
  const s = value.trim().replace(/,/g, "").replace(/\s+/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return String(n);
}

export function normalizeFact(f: Fact): Fact {
  const entity = squash(f.entity).toLowerCase();
  const attribute = squash(f.attribute).toLowerCase();
  const numeric = pureNumber(f.value);
  const unit = f.unit === undefined ? undefined : squash(f.unit).toLowerCase();
  const next: Fact = {
    id: f.id,
    entity,
    attribute,
    value: numeric ?? squash(f.value),
    quote: f.quote,
    atMs: f.atMs,
  };
  if (f.caseId !== undefined) next.caseId = f.caseId;
  if (unit) next.unit = unit;
  return next;
}

function parseQuantity(value: string, unit: string | undefined): Omit<Quantity, "forgetting"> {
  const text = squash(value);
  const explicit = unit ? squash(unit).toLowerCase() : "";
  const stripped = text.replace(/,/g, "");
  const matched = stripped.match(/^(-?\d+(?:\.\d+)?)(?:\s*([A-Za-z]+))?$/);
  let numeric: number | null = null;
  let embedded = "";
  if (matched) {
    const suffix = (matched[2] ?? "").toLowerCase();
    const known = lookup(TIME_TO_MS, suffix) !== undefined || lookup(SCALE, suffix) !== undefined;
    if (!suffix) {
      numeric = Number(matched[1]);
    } else if (known && (!explicit || suffix === explicit)) {
      numeric = Number(matched[1]);
      embedded = suffix;
    }
  }
  const label = explicit || embedded;
  if (numeric === null || !Number.isFinite(numeric)) {
    return { numeric: null, family: "none", factor: 1, unitLabel: label, text };
  }
  const time = lookup(TIME_TO_MS, label);
  if (time !== undefined) return { numeric, family: "time", factor: time, unitLabel: label, text };
  const scale = lookup(SCALE, label);
  if (scale !== undefined) return { numeric, family: "scale", factor: scale, unitLabel: label, text };
  if (!label) return { numeric, family: "none", factor: 1, unitLabel: "", text };
  return { numeric, family: "other", factor: 1, unitLabel: label, text };
}

function measure(f: Fact): Quantity {
  const n = normalizeFact(f);
  if (isForgetting(f.value) || isForgetting(n.value)) {
    return { forgetting: true, numeric: null, family: "none", factor: 1, unitLabel: "", text: squash(f.value) };
  }
  return { forgetting: false, ...parseQuantity(n.value, n.unit) };
}

function sameKey(a: Fact, b: Fact): boolean {
  const left = normalizeFact(a);
  const right = normalizeFact(b);
  return left.entity === right.entity && left.attribute === right.attribute;
}

/** Relative gap above 10%, or one value at least twice the other. */
function numbersConflict(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  if (Math.abs(a - b) <= scale * 1e-9) return false;
  if (a !== 0 && b !== 0 && Math.sign(a) !== Math.sign(b)) return true;
  const hi = Math.max(Math.abs(a), Math.abs(b));
  const lo = Math.min(Math.abs(a), Math.abs(b));
  if (lo === 0) return hi > 0;
  return (hi - lo) / lo > 0.1 || hi >= 2 * lo;
}

function textsConflict(a: string, b: string): boolean {
  const x = squash(a).toLowerCase();
  const y = squash(b).toLowerCase();
  if (x === y || x.includes(y) || y.includes(x)) return false;
  return true;
}

function pairConflicts(a: Quantity, b: Quantity): boolean {
  if (a.numeric === null || b.numeric === null) return textsConflict(a.text, b.text);
  const left = a.numeric * a.factor;
  const right = b.numeric * b.factor;
  const convertible =
    (a.family === "time" && b.family === "time") ||
    (a.family === "scale" && b.family === "scale") ||
    (a.family === "scale" && b.family === "none") ||
    (a.family === "none" && b.family === "scale") ||
    (a.family === "none" && b.family === "none") ||
    (a.family === "other" && b.family === "other" && a.unitLabel === b.unitLabel);
  if (!convertible) return true;
  return numbersConflict(left, right);
}

function shown(f: Fact): string {
  const value = squash(f.value);
  const unit = f.unit?.trim();
  return unit ? `${value} ${unit}` : value;
}

function sentence(earlier: Fact, later: Fact): string {
  const entity = squash(earlier.entity);
  const attribute = squash(earlier.attribute).replace(/_/g, " ");
  return `${entity} ${attribute} is recorded as ${shown(earlier)} and as ${shown(later)}.`;
}

export function suspectConflict(existing: Fact[], incoming: Fact): ConflictSuspicion | null {
  if (isForgetting(incoming.value)) return null;
  for (const other of existing) {
    if (other.id === incoming.id) continue;
    if (!sameKey(other, incoming)) continue;
    if (isForgetting(other.value)) continue;
    if (!pairConflicts(measure(other), measure(incoming))) continue;
    const [first, second] = other.atMs <= incoming.atMs ? [other, incoming] : [incoming, other];
    return { factIds: [first.id, second.id], note: sentence(first, second) };
  }
  return null;
}
