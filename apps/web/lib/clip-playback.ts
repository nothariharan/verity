"use client";

import { SERVER_URL } from "@/lib/session";

let current: HTMLAudioElement | null = null;

/**
 * Play the candidate recording for a receipt window.
 * candidate.wav sample 0 is session time 0, so clip times are currentTime.
 * Resolves false when the session has no recording.
 */
export function playCandidateClip(sessionId: string, startMs: number, endMs: number): Promise<boolean> {
  const url = `${SERVER_URL}/v1/sessions/${sessionId}/audio/candidate`;
  const audio = current ?? new Audio();
  current = audio;
  audio.crossOrigin = "anonymous";
  const start = Math.max(0, startMs / 1000);
  const end = Math.max(start + 0.05, endMs / 1000);

  return new Promise((resolve) => {
    const onTime = () => {
      if (audio.currentTime >= end - 0.02) {
        audio.pause();
        audio.removeEventListener("timeupdate", onTime);
      }
    };
    const fail = () => {
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      audio.removeEventListener("error", fail);
      audio.removeEventListener("loadedmetadata", begin);
    };
    const begin = () => {
      cleanup();
      const duration = Number.isFinite(audio.duration) ? audio.duration : end;
      audio.currentTime = Math.min(start, Math.max(0, duration - 0.05));
      audio.addEventListener("timeupdate", onTime);
      void audio.play().then(
        () => resolve(true),
        () => resolve(false),
      );
    };
    audio.addEventListener("error", fail);
    if (!audio.src.endsWith(`/v1/sessions/${sessionId}/audio/candidate`)) {
      audio.addEventListener("loadedmetadata", begin);
      audio.src = url;
      audio.load();
    } else {
      begin();
    }
  });
}
