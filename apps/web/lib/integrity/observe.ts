"use client";

/**
 * Browser integrity observations. Neutral timestamps only — no score, no accusation.
 * Focus uses document visibility and waits 1.5s so a glance does not emit.
 */

export const FOCUS_HOLD_MS = 1500;
export const FOCUS_LOST_DETAIL = "Interview tab hidden";
export const FOCUS_RETURNED_DETAIL = "Interview tab visible again";

const VIRTUAL_DEVICE = /virtual|obs|manycam|vb-audio|blackhole|loopback|snap camera/i;

export type FocusObservation = {
  kind: "FOCUS_LOST" | "FOCUS_RETURNED";
  startMs: number;
  detail: string;
};

export type DeviceObservation = {
  kind: "VIRTUAL_AUDIO_DEVICE" | "VIRTUAL_CAMERA";
  startMs: number;
  detail: string;
};

/**
 * Watch tab visibility. `baselineMs` is a `performance.now()` origin; `startMs` is milliseconds after it.
 * Returns an unsubscribe function.
 */
export function watchFocus(onObs: (obs: FocusObservation) => void, baselineMs: number): () => void {
  if (typeof document === "undefined") return () => {};

  let lostEmitted = false;
  let hiddenAt = 0;
  let timer: number | null = null;

  const sessionMs = (at: number) => Math.max(0, Math.round(at - baselineMs));

  const clearTimer = () => {
    if (timer === null) return;
    window.clearTimeout(timer);
    timer = null;
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = performance.now();
      clearTimer();
      timer = window.setTimeout(() => {
        timer = null;
        if (document.visibilityState !== "hidden") return;
        lostEmitted = true;
        onObs({ kind: "FOCUS_LOST", startMs: sessionMs(hiddenAt), detail: FOCUS_LOST_DETAIL });
      }, FOCUS_HOLD_MS);
      return;
    }

    clearTimer();
    if (!lostEmitted) return;
    lostEmitted = false;
    onObs({ kind: "FOCUS_RETURNED", startMs: sessionMs(performance.now()), detail: FOCUS_RETURNED_DETAIL });
  };

  document.addEventListener("visibilitychange", onVisibility);
  if (document.visibilityState === "hidden") onVisibility();

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    clearTimer();
  };
}

/**
 * Watch `enumerateDevices()` labels. A matching label emits once.
 * Detail is the device label alone.
 */
export function watchDevices(onObs: (obs: DeviceObservation) => void, baselineMs: number): () => void {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return () => {};

  const seen = new Set<string>();
  let stopped = false;
  let pending: Promise<void> = Promise.resolve();

  const scan = () => {
    pending = pending.then(async () => {
      if (stopped) return;
      let devices: MediaDeviceInfo[];
      try {
        devices = await navigator.mediaDevices.enumerateDevices();
      } catch {
        // Labels stay unavailable until permission; the next devicechange retries.
        return;
      }
      if (stopped) return;
      const startMs = Math.max(0, Math.round(performance.now() - baselineMs));
      for (const device of devices) {
        const label = device.label.trim();
        if (!label || !VIRTUAL_DEVICE.test(label)) continue;
        const kind = deviceKind(device.kind);
        if (!kind) continue;
        const key = `${kind}\0${label}`;
        if (seen.has(key)) continue;
        seen.add(key);
        onObs({ kind, startMs, detail: label });
      }
    }).catch(() => {
      // A listener error must not stall later device scans.
    });
  };

  navigator.mediaDevices.addEventListener("devicechange", scan);
  scan();

  return () => {
    stopped = true;
    navigator.mediaDevices.removeEventListener("devicechange", scan);
  };
}

function deviceKind(kind: MediaDeviceKind): DeviceObservation["kind"] | null {
  if (kind === "videoinput") return "VIRTUAL_CAMERA";
  if (kind === "audioinput" || kind === "audiooutput") return "VIRTUAL_AUDIO_DEVICE";
  return null;
}
