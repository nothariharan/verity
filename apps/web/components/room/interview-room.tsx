"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Receipt, SessionState } from "@verity/contracts";
import { DemoBadge, Logo } from "@/components/ui/primitives";
import { orderedCases } from "@/lib/session";
import { formatClock } from "@/lib/utils";
import { EvidencePanel } from "./evidence-panel";
import { InvestigationPanel } from "./investigation-panel";
import { PlanPanel } from "./plan-panel";
import { Stage, type StageControls } from "./stage";
import { TranscriptPanel } from "./transcript-panel";

export type RoomViewer = "team" | "practice" | "candidate";

/**
 * The interview room (reference layout): plan on the left, the speaking orb and
 * current question in the middle, the live investigation on the right, transcript
 * and key evidence below. `candidate` hides every belief and verdict (AGENTS.md:
 * the candidate in a hiring interview never sees the board).
 */
export function InterviewRoom({
  s,
  t,
  viewer,
  demo,
  level,
  controls,
  onAnswer,
  onEnd,
  onPlay,
  banner,
  standalone,
  connection,
}: {
  s: SessionState;
  t: number;
  viewer: RoomViewer;
  demo?: boolean;
  level?: number;
  controls?: StageControls;
  onAnswer?: (text: string) => void;
  onEnd?: () => void;
  onPlay?: (r: Receipt) => void;
  banner?: ReactNode;
  standalone?: boolean;
  connection?: string;
}) {
  const reveal = viewer !== "candidate";
  const cases = orderedCases(s);
  const total = (s.meta?.durationSec ?? 900) * 1000;
  const status = s.ended ? "Ended" : s.started ? "In progress" : "Not started";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          {standalone && (
            <Link href="/" className="mr-4">
              <Logo />
            </Link>
          )}
          <span className="flex min-w-0 items-center gap-2 text-[13.5px] font-medium">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.ended ? "var(--open)" : "var(--owned)" }} />
            <span className="truncate">{s.meta?.role ?? "Interview"} Interview</span>
          </span>
          <span className="hidden text-muted sm:inline">–</span>
          <span className="hidden rounded-full bg-bg-sunk px-3 py-1 text-[12px] text-ink-2 sm:inline">{status}</span>
          <span className="rounded-full bg-card px-3 py-1 font-mono text-[12px] shadow-[var(--shadow-card)] ring-1 ring-line">
            {formatClock(t)} / {formatClock(total)}
          </span>
          {demo && <DemoBadge />}
          {connection && <span className="hidden font-mono text-[11px] text-muted md:inline">{connection}</span>}
        </div>
        <div className="flex items-center gap-2">
          {viewer === "team" && s.meta?.candidateName && (
            <span className="hidden text-[13px] text-muted lg:inline">Candidate: {s.meta.candidateName}</span>
          )}
          {onEnd && !s.ended && (
            <button
              type="button"
              onClick={onEnd}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#E5533D] px-4 text-[13px] font-medium text-white shadow-[0_6px_16px_-6px_rgba(229,83,61,.6)] transition hover:bg-[#d9472f]"
            >
              <span className="h-2.5 w-2.5 rounded-[3px] border-[1.5px] border-white" />
              End interview
            </button>
          )}
        </div>
      </header>
      {banner}

      <div className="grid flex-1 gap-4 px-4 pb-4 md:px-6 lg:grid-cols-[280px_minmax(0,1fr)_320px] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <PlanPanel cases={cases} activeId={s.activeCaseId} ended={!!s.ended} reveal={reveal} />
        <Stage s={s} level={level} controls={controls} />
        {reveal ? (
          <InvestigationPanel s={s} />
        ) : (
          <aside className="card hidden flex-col gap-4 p-5 text-[13px] leading-relaxed text-ink-2 lg:flex">
            <p className="eyebrow">How this works</p>
            <p>Verity asks about specific things on your resume. Take your time; pauses are fine.</p>
            <p>Saying &ldquo;I don&apos;t remember&rdquo; is okay. Forgetting isn&apos;t treated as a problem.</p>
            <p>You can interrupt Verity at any time, or switch to typing.</p>
          </aside>
        )}
        <div className="lg:col-span-2">
          <TranscriptPanel s={s} onAnswer={onAnswer} />
        </div>
        {reveal ? <EvidencePanel s={s} onPlay={onPlay} /> : <div className="hidden lg:block" />}
      </div>
    </div>
  );
}
