"use client";

import { useRef } from "react";
import { VoiceOrb, type OrbMode } from "@/components/voice/voice-orb";
import { Pill } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { useInView, useLoopClock, useReducedMotion } from "./hooks";

const PHASE_MS = 2600;
const PHASES: { mode: OrbMode; floor: string; color: string; caption: string }[] = [
  { mode: "listening", floor: "Listening", color: "var(--open)", caption: "Waiting for the candidate to start." },
  { mode: "candidate", floor: "You're speaking", color: "var(--owned)", caption: "“…so I split the hot partition instead of adding brokers.”" },
  { mode: "verity", floor: "Verity speaking", color: "var(--contributed)", caption: "“What did splitting it cost you downstream?”" },
];

export function VoiceDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, "100px");
  const t = useLoopClock(inView && !reduced, PHASE_MS * PHASES.length, 80);
  const idx = reduced ? 1 : Math.floor(t / PHASE_MS);
  const phase = PHASES[idx]!;
  const level =
    reduced || phase.mode === "listening" ? 0.1 : 0.35 + 0.3 * Math.abs(Math.sin(t / 170)) * Math.abs(Math.cos(t / 410));

  return (
    <div ref={ref} className="card flex flex-col items-center px-6 pb-8 pt-10">
      <div className="flex min-h-[280px] items-center justify-center">
        {inView || reduced ? (
          <VoiceOrb mode={phase.mode} level={level} size={200} />
        ) : (
          <div aria-hidden className="h-[200px] w-[200px] rounded-full bg-bg-sunk" />
        )}
      </div>
      <div aria-live="polite" className="mt-2 flex flex-col items-center gap-3 text-center">
        <Pill color={phase.color} pulse={!reduced && phase.mode !== "listening"}>
          {phase.floor}
        </Pill>
        <p className="min-h-[3em] max-w-sm text-[15px] leading-relaxed text-muted">{phase.caption}</p>
      </div>
      <ol className="mt-4 flex gap-2" aria-label="Floor states">
        {PHASES.map((p, i) => (
          <li
            key={p.mode}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider transition-colors",
              i === idx ? "border-ink bg-ink text-bg" : "border-line text-muted",
            )}
          >
            {p.floor}
          </li>
        ))}
      </ol>
    </div>
  );
}
