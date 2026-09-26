/**
 * Experimental SECOND_VOICE_POSSIBLE signal.
 * Streaming STT has no diarization, so this is only an overlap heuristic.
 * It returns a boolean and a neutral detail. It never returns a score.
 */

/** Neutral wording. Not a judgement and not a score. */
export const SECOND_VOICE_DETAIL = "Speech detected while the candidate transcript was idle";

export type OverlapInput = {
  candidateTranscriptIdleMs: number;
  vadSpeaking: boolean;
  veritySpeaking: boolean;
};

/**
 * True only when voice activity continues, Verity is silent, and the candidate
 * transcript has been idle for more than 1500 ms.
 */
export function overlapHeuristic(input: OverlapInput): boolean {
  return input.vadSpeaking && !input.veritySpeaking && input.candidateTranscriptIdleMs > 1500;
}
