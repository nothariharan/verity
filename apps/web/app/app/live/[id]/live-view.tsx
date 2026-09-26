"use client";

import { InterviewRoom } from "@/components/room/interview-room";
import { DEMO_EVENTS } from "@/lib/fixtures/demo";
import { demoLevel } from "@/lib/demo-level";
import { useLiveSession, useReplay } from "@/lib/session";

export function LiveView({ id }: { id: string }) {
  return id.startsWith("demo") ? <DemoLive /> : <RealLive id={id} />;
}

function DemoLive() {
  const { state, t, seek } = useReplay(DEMO_EVENTS, { speed: 1, loop: true });
  return <InterviewRoom s={state} t={t} viewer="team" demo level={demoLevel(state, t)} onEnd={() => seek(0)} />;
}

function RealLive({ id }: { id: string }) {
  const { state, status, send } = useLiveSession(id, { textMode: true });
  return (
    <InterviewRoom
      s={state}
      t={state.atMs}
      viewer="team"
      connection={status === "open" ? "connected" : status}
      onEnd={() => send({ type: "END" })}
    />
  );
}
