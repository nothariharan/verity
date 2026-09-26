/**
 * TTS input only. Callers keep the committed question text unchanged.
 * Tokens are whole words: `150k` and `p99` stay as written.
 */
const SPEECH_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bk8s\b/gi, "Kubernetes"],
  [/\bp95\b/gi, "P ninety-five"],
  [/\bqps\b/gi, "queries per second"],
  [/\b100k\b/gi, "one hundred thousand"],
  [/\b50k\b/gi, "fifty thousand"],
];

export function normalizeForSpeech(text: string): string {
  let spoken = text;
  for (const [pattern, replacement] of SPEECH_REPLACEMENTS) {
    spoken = spoken.replace(pattern, replacement);
  }
  return spoken;
}
