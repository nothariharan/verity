"use client";

import { LiveBoard } from "@/components/board/live-board";
import { Icon } from "@/components/app/icons";
import { DEMO_DURATION_MS, DEMO_EVENTS } from "@/lib/fixtures/demo";
import { useLiveSession, useReplay } from "@/lib/session";

export function LiveView({ id }: { id: string }) {
  return id.startsWith("demo") ? <DemoLive /> : <RealLive id={id} />;
}

function DemoLive() {
  const { state, t, playing, setPlaying, seek } = useReplay(DEMO_EVENTS, { speed: 1, loop: true });
  return (
    <LiveBoard
      s={state}
      t={t}
      durationMs={DEMO_DURATION_MS}
      demo
      controls={
        <>
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-line bg-card"
            aria-label={playing ? "Pause replay" : "Play replay"}
          >
            {playing ? <Icon.pause /> : <Icon.play />}
          </button>
          <button type="button" onClick={() => seek(0)} className="rounded-full border border-line bg-card px-2.5 py-1 text-[12px]">
            Restart
          </button>
        </>
      }
    />
  );
}

function RealLive({ id }: { id: string }) {
  const { state, status } = useLiveSession(id, { textMode: true });
  const duration = (state.meta?.durationSec ?? 900) * 1000;
  return <LiveBoard s={state} t={state.atMs} durationMs={duration} connection={status === "open" ? "connected" : status} />;
}
