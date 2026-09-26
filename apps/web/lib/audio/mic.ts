"use client";

/**
 * Candidate mic: always-on capture, downsampled to 16 kHz PCM16 mono in 20 ms frames.
 * Prefers an AudioWorklet loaded from a blob URL, and falls back to ScriptProcessor.
 */

export const MIC_SAMPLE_RATE = 16_000;
export const MIC_FRAME_SAMPLES = 320;
export const MIC_FRAME_BYTES = 640;

const WORKLET_NAME = "verity-mic";
const WORKLET_SOURCE = `
class VerityMicProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channels = inputs[0];
    const channel = channels && channels[0];
    if (channel && channel.length) {
      const copy = new Float32Array(channel.length);
      copy.set(channel);
      this.port.postMessage(copy, [copy.buffer]);
    }
    return true;
  }
}
registerProcessor("${WORKLET_NAME}", VerityMicProcessor);
`;

export type MicFrameHandler = (frame: Uint8Array) => void;

export type MicHandle = {
  /** Latest block RMS, clamped to 0..1. Reads 0 after stop. */
  readonly level: number;
  stop: () => void;
};

let epoch = 0;
let level = 0;
let releaseCurrent: (() => void) | null = null;

/** RMS the orb can poll while the mic is open. */
export function getMicLevel(): number {
  return level;
}

export function stopMic(): void {
  epoch += 1;
  level = 0;
  const release = releaseCurrent;
  releaseCurrent = null;
  release?.();
}

export async function startMic(onFrame: MicFrameHandler): Promise<MicHandle> {
  stopMic();
  const myEpoch = epoch;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    },
  });

  if (myEpoch !== epoch) {
    stopTracks(stream);
    return inertHandle();
  }

  const ctx = new AudioContext();
  if (ctx.state === "suspended") await ctx.resume();

  if (myEpoch !== epoch) {
    stopTracks(stream);
    void ctx.close();
    return inertHandle();
  }

  const source = ctx.createMediaStreamSource(stream);
  const framer = new PcmFramer();
  const ingest = (samples: Float32Array) => {
    if (myEpoch !== epoch) return;
    level = rmsLevel(samples);
    framer.push(samples, ctx.sampleRate, (frame) => {
      if (myEpoch === epoch) onFrame(frame);
    });
  };

  let connected: { release: () => void };
  try {
    connected = await connectCapture(ctx, source, ingest);
  } catch (error) {
    source.disconnect();
    stopTracks(stream);
    void ctx.close();
    throw error;
  }
  if (myEpoch !== epoch) {
    connected.release();
    stopTracks(stream);
    void ctx.close();
    return inertHandle();
  }

  const release = () => {
    connected.release();
    source.disconnect();
    stopTracks(stream);
    void ctx.close();
  };
  releaseCurrent = release;

  return {
    get level() {
      return myEpoch === epoch ? level : 0;
    },
    stop() {
      if (myEpoch === epoch) stopMic();
    },
  };
}

function inertHandle(): MicHandle {
  return { level: 0, stop() {} };
}

function stopTracks(stream: MediaStream) {
  for (const track of stream.getTracks()) track.stop();
}

async function connectCapture(
  ctx: AudioContext,
  source: MediaStreamAudioSourceNode,
  ingest: (samples: Float32Array) => void,
): Promise<{ release: () => void }> {
  if (ctx.audioWorklet) {
    try {
      return await connectWorklet(ctx, source, ingest);
    } catch {
      // Blob worklets are unavailable in some browsers; ScriptProcessor still frames PCM.
    }
  }
  return connectScriptProcessor(ctx, source, ingest);
}

async function connectWorklet(
  ctx: AudioContext,
  source: MediaStreamAudioSourceNode,
  ingest: (samples: Float32Array) => void,
): Promise<{ release: () => void }> {
  const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
  try {
    await ctx.audioWorklet.addModule(url);
    const node = new AudioWorkletNode(ctx, WORKLET_NAME);
    node.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (event.data instanceof Float32Array) ingest(event.data);
    };
    const mute = silentSink(ctx);
    source.connect(node);
    node.connect(mute);
    return {
      release() {
        node.port.onmessage = null;
        node.disconnect();
        mute.disconnect();
        URL.revokeObjectURL(url);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function connectScriptProcessor(
  ctx: AudioContext,
  source: MediaStreamAudioSourceNode,
  ingest: (samples: Float32Array) => void,
): { release: () => void } {
  const processor = ctx.createScriptProcessor(2048, 1, 1);
  processor.onaudioprocess = (event) => {
    ingest(event.inputBuffer.getChannelData(0));
  };
  const mute = silentSink(ctx);
  source.connect(processor);
  processor.connect(mute);
  return {
    release() {
      processor.onaudioprocess = null;
      processor.disconnect();
      mute.disconnect();
    },
  };
}

/** Keeps the capture node pulling without playing the mic back. */
function silentSink(ctx: AudioContext): GainNode {
  const mute = ctx.createGain();
  mute.gain.value = 0;
  mute.connect(ctx.destination);
  return mute;
}

function rmsLevel(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i] ?? 0;
    sum += sample * sample;
  }
  const rms = Math.sqrt(sum / samples.length);
  return rms > 1 ? 1 : rms;
}

class PcmFramer {
  private source = new Float32Array(0);
  private phase = 0;
  private out = new Float32Array(MIC_FRAME_SAMPLES);
  private outCount = 0;

  push(chunk: Float32Array, inputHz: number, onFrame: MicFrameHandler): void {
    if (chunk.length === 0 || !(inputHz > 0)) return;
    const merged = new Float32Array(this.source.length + chunk.length);
    merged.set(this.source, 0);
    merged.set(chunk, this.source.length);

    const step = inputHz / MIC_SAMPLE_RATE;
    let phase = this.phase;
    while (phase + 1 < merged.length) {
      const index = Math.floor(phase);
      const frac = phase - index;
      const left = merged[index] ?? 0;
      const right = merged[index + 1] ?? left;
      this.out[this.outCount] = left + (right - left) * frac;
      this.outCount += 1;
      if (this.outCount === MIC_FRAME_SAMPLES) {
        onFrame(floatToPcm16(this.out));
        this.outCount = 0;
      }
      phase += step;
    }

    const consumed = Math.floor(phase);
    this.source = merged.subarray(consumed).slice();
    this.phase = phase - consumed;
  }
}

function floatToPcm16(samples: Float32Array): Uint8Array {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0));
    const pcm = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
    view.setInt16(i * 2, pcm, true);
  }
  return bytes;
}
