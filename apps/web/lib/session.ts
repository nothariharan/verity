"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyState, reduce, reduceAll, type ClientMessage, type ControlMessage, type SessionState, type VerityEvent } from "@verity/contracts";

export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:8787";

/** Replays a recorded event log against the session clock (demo + dossier scrubber). */
export function useReplay(events: readonly VerityEvent[], opts: { speed?: number; loop?: boolean; autoplay?: boolean } = {}) {
  const { speed = 1, loop = false, autoplay = true } = opts;
  const end = events.at(-1)?.atMs ?? 0;
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      const dt = last.current === null ? 0 : now - last.current;
      last.current = now;
      setT((prev) => {
        const next = prev + dt * speed;
        if (next > end + 1500) {
          if (loop) return 0;
          setPlaying(false);
          return end;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, end, loop]);

  const state = useMemo(() => reduceAll(events, t), [events, t]);
  return { state, t, end, playing, setPlaying, seek: setT };
}

export type LiveStatus = "connecting" | "open" | "closed" | "error";

/** Live session over WebSocket with reconnect + replay from lastSeq. */
export function useLiveSession(sessionId: string | null, opts: { textMode?: boolean } = {}) {
  const [state, setState] = useState<SessionState>(emptyState);
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const stateRef = useRef(state);
  const wsRef = useRef<WebSocket | null>(null);
  const events = useRef<VerityEvent[]>([]);
  const pcmRef = useRef<(pcm: ArrayBuffer) => void>(() => {});
  const controlRef = useRef<(msg: ControlMessage) => void>(() => {});
  const textMode = opts.textMode ?? true;

  useEffect(() => {
    if (!sessionId) return;
    let stopped = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      setStatus("connecting");
      const ws = new WebSocket(`${SERVER_URL.replace(/^http/, "ws")}/v1/session/${sessionId}`);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;
      ws.onopen = () => {
        retry = 0;
        ws.send(JSON.stringify({ type: "HELLO", lastSeq: stateRef.current.lastSeq, textMode } satisfies ClientMessage));
      };
      ws.onmessage = (m) => {
        if (m.data instanceof ArrayBuffer) {
          pcmRef.current(m.data);
          return;
        }
        if (typeof m.data !== "string") return;
        const msg = JSON.parse(m.data);
        if (msg.type === "TTS_BEGIN" || msg.type === "TTS_END" || msg.type === "YIELD" || msg.type === "ACK") {
          controlRef.current(msg as ControlMessage);
          return;
        }
        if (msg.type === "READY") return setStatus("open");
        if (typeof msg.seq === "number") {
          events.current.push(msg as VerityEvent);
          const next = reduce(stateRef.current, msg as VerityEvent);
          stateRef.current = next;
          setState(next);
        }
      };
      ws.onerror = () => setStatus("error");
      ws.onclose = () => {
        if (stopped) return;
        setStatus("closed");
        timer = setTimeout(connect, Math.min(4000, 400 * 2 ** retry++));
      };
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      wsRef.current?.close();
    };
  }, [sessionId, textMode]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  const sendBinary = useCallback((pcm: Uint8Array) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(pcm);
  }, []);

  return {
    state,
    status,
    send,
    sendBinary,
    events: events.current,
    onPcm: (fn: (pcm: ArrayBuffer) => void) => {
      pcmRef.current = fn;
    },
    onControl: (fn: (msg: ControlMessage) => void) => {
      controlRef.current = fn;
    },
  };
}

/** Cases in deterministic board order: importance desc, then id. Max 12. */
export function orderedCases(s: SessionState) {
  return s.caseOrder
    .map((id) => s.cases[id]!)
    .sort((a, z) => z.importance - a.importance || a.id.localeCompare(z.id))
    .slice(0, 12);
}

/** Final status for a finished session: an unsettled case that was asked about is Open. */
export function finalStatus(c: SessionState["cases"][string], ended: boolean) {
  if (ended && c.status === "INVESTIGATING") return "OPEN" as const;
  return c.status;
}
