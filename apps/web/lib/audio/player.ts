"use client";

/**
 * Queued PCM playback for Verity's voice. Duck drops the gain immediately;
 * stop flushes everything still queued.
 */

const DUCK_GAIN = 0.15;
const FULL_GAIN = 1;

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let nextAt = 0;
let epoch = 0;
let ended: (() => void) | null = null;
const active = new Set<AudioBufferSourceNode>();

/** Call from the consent click so the first spoken line is allowed to play. */
export function primePlayback(): void {
  ensure();
}

/** Register the callback fired once the queue finishes on its own. */
export function onEnded(cb: () => void): void {
  ended = cb;
}

export function playPcm(pcm: Uint8Array, sampleRate: number): void {
  if (pcm.byteLength < 2 || !(sampleRate > 0) || !Number.isFinite(sampleRate)) return;
  const audioCtx = ensure();
  const samples = pcm16ToFloat32(pcm);
  if (samples.length === 0) return;

  const buffer = audioCtx.createBuffer(1, samples.length, sampleRate);
  buffer.getChannelData(0).set(samples);

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(gainNode());

  const token = epoch;
  const startAt = Math.max(audioCtx.currentTime, nextAt);
  nextAt = startAt + buffer.duration;
  active.add(source);
  source.onended = () => {
    active.delete(source);
    if (token !== epoch || active.size > 0) return;
    ended?.();
  };
  source.start(startAt);
}

/** Barge-in: drop playback to 0.15 at once. */
export function duck(): void {
  setGain(DUCK_GAIN);
}

/** No confirmation: bring playback back to full. */
export function restore(): void {
  setGain(FULL_GAIN);
}

/** Yield: drop queued and in-flight audio and return the gain to full. Does not fire onEnded. */
export function stop(): void {
  epoch += 1;
  nextAt = 0;
  for (const source of active) {
    source.onended = null;
    try {
      source.stop();
    } catch {
      // Already stopped.
    }
  }
  active.clear();
  if (ctx && gain) {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(FULL_GAIN, now);
  }
}

function ensure(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("PCM playback runs in the browser");
  }
  if (!ctx) {
    ctx = new AudioContext();
    gain = ctx.createGain();
    gain.gain.value = FULL_GAIN;
    gain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function gainNode(): GainNode {
  ensure();
  if (!gain) throw new Error("PCM playback gain is missing");
  return gain;
}

function setGain(value: number): void {
  const node = gainNode();
  const now = node.context.currentTime;
  node.gain.cancelScheduledValues(now);
  node.gain.setValueAtTime(value, now);
}

function pcm16ToFloat32(pcm: Uint8Array): Float32Array {
  const count = Math.floor(pcm.byteLength / 2);
  const out = new Float32Array(count);
  const view = new DataView(pcm.buffer, pcm.byteOffset, count * 2);
  for (let i = 0; i < count; i++) {
    out[i] = view.getInt16(i * 2, true) / 32768;
  }
  return out;
}
