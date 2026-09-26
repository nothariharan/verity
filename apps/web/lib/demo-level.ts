import type { SessionState } from "@verity/contracts";

/** Synthetic audio level for demo replays only (no audio exists in the scripted log). */
export function demoLevel(s: SessionState, t: number): number {
  if (!s.partial && !s.speakingQuestionId) return 0;
  const v = 0.45 + 0.3 * Math.sin(t / 110) + 0.2 * Math.sin(t / 47 + 1.3);
  return Math.max(0, Math.min(1, v));
}
