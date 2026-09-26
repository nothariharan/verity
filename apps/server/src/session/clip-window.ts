/** Receipt clip window from DATA_MODEL.md: 1.5s before the quote, 0.5s after, capped at 20s, clamped to the session. */

const PRE_MS = 1_500;
const POST_MS = 500;
const CAP_MS = 20_000;

export function clipWindow(quoteStartMs: number, quoteEndMs: number, sessionEndMs: number): { startMs: number; endMs: number } {
  const edge = Math.max(0, sessionEndMs);
  const q0 = Math.min(Math.max(0, quoteStartMs), edge);
  const q1 = Math.min(Math.max(q0, quoteEndMs), edge);
  let start = Math.max(0, q0 - PRE_MS);
  let end = Math.min(edge, q1 + POST_MS);
  if (end - start > CAP_MS) end = start + CAP_MS;
  if (end > edge) {
    end = edge;
    start = Math.max(0, end - CAP_MS);
  }
  return { startMs: Math.round(start), endMs: Math.round(end) };
}
