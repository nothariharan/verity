/**
 * Echo guard: token-set Jaccard between what Verity has spoken and a candidate partial.
 * Partials at or above the threshold are treated as the speaker's own voice coming back.
 */

function tokenSet(text: string): Set<string> {
  const found = text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const tokens = new Set<string>();
  for (const raw of found) {
    const token = raw.replace(/^'+|'+$/g, "");
    if (token) tokens.add(token);
  }
  return tokens;
}

/** Jaccard similarity of the two token sets, in 0..1. Empty text scores 0. */
export function tokenSimilarity(spokenSoFar: string, partial: string): number {
  const spoken = tokenSet(spokenSoFar);
  const heard = tokenSet(partial);
  if (spoken.size === 0 || heard.size === 0) return 0;
  let intersection = 0;
  for (const token of heard) {
    if (spoken.has(token)) intersection += 1;
  }
  const union = spoken.size + heard.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}

/** True when a candidate partial is similar enough to Verity's spoken text to drop. */
export function isEcho(partial: string, spoken: string, threshold = 0.8): boolean {
  return tokenSimilarity(spoken, partial) >= threshold;
}
