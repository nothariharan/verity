"use client";

import { useEffect, useRef, useState } from "react";
import type { ClientMessage, ControlMessage, SessionState } from "@verity/contracts";
import { getMicLevel, startMic, stopMic } from "@/lib/audio/mic";
import { duck, onEnded, playPcm, restore, stop } from "@/lib/audio/player";
import { watchDevices, watchFocus } from "@/lib/integrity/observe";

/** Mic, Flash playback, barge-in duck, and neutral focus/device notes for one live interview. */
export function useRoomVoice(opts: {
  enabled: boolean;
  state: SessionState;
  send: (msg: ClientMessage) => void;
  sendBinary: (pcm: Uint8Array) => void;
  onPcm: (fn: (pcm: ArrayBuffer) => void) => void;
  onControl: (fn: (msg: ControlMessage) => void) => void;
}) {
  const [level, setLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const questionIdRef = useRef<string | undefined>(undefined);
  questionIdRef.current = opts.state.speakingQuestionId ?? opts.state.questionOrder.at(-1);

  useEffect(() => {
    if (!opts.enabled) return;
    const questionRef = questionIdRef;
    let sampleRate = 16000;
    let speaking = false;
    let ducked = false;
    let restoreTimer: ReturnType<typeof setTimeout> | undefined;
    const baseline = performance.now();

    opts.onPcm((pcm) => playPcm(new Uint8Array(pcm), sampleRate));
    opts.onControl((msg) => {
      if (msg.type === "TTS_BEGIN") {
        sampleRate = msg.sampleRate;
        speaking = true;
      }
      if (msg.type === "TTS_END") speaking = false;
      if (msg.type === "YIELD") {
        speaking = false;
        stop();
        ducked = false;
      }
      if (msg.type === "ACK") blip();
    });
    onEnded(() => {
      const questionId = questionRef.current;
      if (questionId) opts.send({ type: "PLAYBACK", questionId, event: "ended" });
    });

    const stopFocus = watchFocus((obs) => {
      opts.send({
        type: "OBSERVATION",
        observation: { ...obs, duringQuestionId: opts.state.questionOrder.at(-1) },
      });
    }, baseline);
    const stopDevices = watchDevices((obs) => {
      opts.send({
        type: "OBSERVATION",
        observation: { ...obs, duringQuestionId: opts.state.questionOrder.at(-1) },
      });
    }, baseline);

    let micStopped = false;
    startMic((frame) => {
      if (!muted && !micStopped) opts.sendBinary(frame);
    }).catch(() => setMicError("Microphone is unavailable. You can type your answers."));

    let vad = false;
    let raf = 0;
    const tick = () => {
      const mic = muted ? 0 : getMicLevel();
      setLevel(speaking ? Math.max(mic, 0.35) : mic);
      const hot = mic > 0.08;
      if (hot !== vad) {
        vad = hot;
        opts.send({ type: "VAD", speaking: hot, clientMs: Math.round(performance.now() - baseline) });
        if (hot && speaking) {
          duck();
          ducked = true;
          clearTimeout(restoreTimer);
          restoreTimer = setTimeout(() => {
            if (ducked) restore();
            ducked = false;
          }, 450);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      micStopped = true;
      stopMic();
      stop();
      stopFocus();
      stopDevices();
      cancelAnimationFrame(raf);
      clearTimeout(restoreTimer);
    };
    // The socket handlers are stable refs. Re-binding on every belief update would restart the mic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, muted]);

  return {
    level,
    muted,
    micError,
    toggleMute: () => setMuted((m) => !m),
  };
}

function blip() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 220;
  gain.gain.value = 0.04;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
  osc.onended = () => void ctx.close();
}
