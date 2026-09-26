"use client";

import { useState } from "react";
import type { Receipt } from "@verity/contracts";
import { InterviewRoom } from "@/components/room/interview-room";
import { CandidateLink } from "@/components/room/candidate-link";
import { DEMO_EVENTS } from "@/lib/fixtures/demo";
import { playCandidateClip } from "@/lib/clip-playback";
import { demoLevel } from "@/lib/demo-level";
import { useLiveSession, useReplay } from "@/lib/session";

export function LiveView({ id, invite = false }: { id: string; invite?: boolean }) {
  return id.startsWith("demo") ? <DemoLive /> : <RealLive id={id} invite={invite} />;
}

function DemoLive() {
  const { state, t, seek } = useReplay(DEMO_EVENTS, { speed: 1, loop: true });
  return <InterviewRoom s={state} t={t} viewer="team" demo level={demoLevel(state, t)} onEnd={() => seek(0)} />;
}

function RealLive({ id, invite }: { id: string; invite: boolean }) {
  const { state, status, send } = useLiveSession(id, { textMode: true });
  const [clipNote, setClipNote] = useState<string | null>(null);
  const onPlay = (r: Receipt) => {
    setClipNote(null);
    void playCandidateClip(id, r.clip.startMs, r.clip.endMs).then((ok) => {
      if (!ok) setClipNote("No recording for that clip yet.");
    });
  };
  return (
    <InterviewRoom
      s={state}
      t={state.atMs}
      viewer="team"
      connection={status === "open" ? "connected" : status}
      onEnd={() => send({ type: "END" })}
      onPlay={onPlay}
      banner={
        <div data-invite={invite ? "ready" : "available"}>
          <CandidateLink id={id} />
          {clipNote && <p className="px-6 pt-2 text-[12.5px] text-muted">{clipNote}</p>}
        </div>
      }
    />
  );
}
