import { describe, expect, it } from "vitest";
import { SECOND_VOICE_DETAIL, overlapHeuristic } from "../../src/integrity/overlap";

const idleSpeech = { candidateTranscriptIdleMs: 1501, vadSpeaking: true, veritySpeaking: false };

describe("overlapHeuristic", () => {
  it("is true only when VAD is speaking, Verity is silent, and the transcript is idle past 1500ms", () => {
    expect(overlapHeuristic(idleSpeech)).toBe(true);
  });

  it("stays false at exactly 1500ms", () => {
    expect(overlapHeuristic({ ...idleSpeech, candidateTranscriptIdleMs: 1500 })).toBe(false);
  });

  it("stays false while the transcript is still moving", () => {
    expect(overlapHeuristic({ ...idleSpeech, candidateTranscriptIdleMs: 0 })).toBe(false);
    expect(overlapHeuristic({ ...idleSpeech, candidateTranscriptIdleMs: 400 })).toBe(false);
  });

  it("stays false when VAD is quiet", () => {
    expect(overlapHeuristic({ ...idleSpeech, vadSpeaking: false })).toBe(false);
  });

  it("stays false while Verity is speaking", () => {
    expect(overlapHeuristic({ ...idleSpeech, veritySpeaking: true })).toBe(false);
  });

  it("exports a neutral detail and no score", () => {
    expect(SECOND_VOICE_DETAIL.length).toBeGreaterThan(0);
    expect(SECOND_VOICE_DETAIL).not.toMatch(/cheat|suspicious|score|probability|flagged|fraud/i);
    expect(SECOND_VOICE_DETAIL).not.toMatch(/\d/);
  });
});
