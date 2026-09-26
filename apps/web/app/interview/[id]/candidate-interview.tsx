"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InterviewRoom } from "@/components/room/interview-room";
import { Button, Logo } from "@/components/ui/primitives";
import { DEMO_EVENTS } from "@/lib/fixtures/demo";
import { demoLevel } from "@/lib/demo-level";
import { useLiveSession, useReplay } from "@/lib/session";

export function CandidateInterview({ id }: { id: string }) {
  const [consented, setConsented] = useState(false);
  const demo = id.startsWith("demo");
  if (!consented) return <Consent onStart={() => setConsented(true)} demo={demo} />;
  return demo ? <DemoInterview /> : <RealInterview id={id} />;
}

function DemoInterview() {
  const { state, t, seek } = useReplay(DEMO_EVENTS, { speed: 1 });
  return (
    <InterviewRoom
      s={state}
      t={t}
      viewer="practice"
      demo
      standalone
      level={demoLevel(state, t)}
      controls={{ onEnd: () => seek(0) }}
    />
  );
}

function RealInterview({ id }: { id: string }) {
  const { state, status, send } = useLiveSession(id, { textMode: true });
  useEffect(() => {
    if (status === "open" && !state.started) send({ type: "START" });
  }, [status, state.started, send]);
  const viewer = state.meta?.mode === "practice" ? "practice" : "candidate";
  return (
    <InterviewRoom
      s={state}
      t={state.atMs}
      viewer={viewer}
      standalone
      connection={status === "open" ? undefined : status}
      onAnswer={(text) => send({ type: "TEXT_ANSWER", text })}
      controls={{ onEnd: () => send({ type: "END" }) }}
      onEnd={() => send({ type: "END" })}
    />
  );
}

function Consent({ onStart, demo }: { onStart: () => void; demo: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center px-6">
        <Link href="/">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="card w-full max-w-[520px] p-8">
          <p className="eyebrow">Before we start</p>
          <h1 className="headline mt-2 text-[28px]">A conversation about your work</h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
            Verity will ask about specific things on your resume, one question at a time. Answer out loud, or type if you prefer.
          </p>
          <ul className="mt-6 space-y-3 text-[13.5px] leading-relaxed text-ink-2">
            <Item title="What's recorded">Your audio, the transcript, and whether this tab is in focus. Camera signals only if you enable them, processed on your device.</Item>
            <Item title="Why">So every assessment can point to the exact moment it came from. There is no overall score.</Item>
            <Item title="Fair by design">Forgetting a detail is fine; it isn&apos;t treated as misrepresentation. Tone, accent, and pace are never assessed.</Item>
          </ul>
          <div className="mt-8 flex items-center gap-3">
            <Button onClick={onStart} arrow>
              {demo ? "Watch the demo interview" : "I understand, start"}
            </Button>
            <Button href="/" variant="ghost">
              Not now
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
      <span>
        <span className="font-medium text-ink">{title}. </span>
        {children}
      </span>
    </li>
  );
}
