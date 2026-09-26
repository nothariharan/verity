"use client";

import { useEffect, useRef, useState } from "react";
import type { SessionState } from "@verity/contracts";
import { cn, formatClock } from "@/lib/utils";

export function TranscriptPanel({ s, onAnswer }: { s: SessionState; onAnswer?: (text: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const lines = [...s.segments, ...(s.partial ? [s.partial] : [])];
  const waiting = s.started && !s.ended && !s.partial && !s.speakingQuestionId && lines.at(-1)?.speaker === "verity";
  const end = Math.max(1, s.atMs);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, s.partial?.text]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAnswer?.(text);
    setDraft("");
  };

  return (
    <section className="card flex h-full min-h-[260px] flex-col p-4">
      <div className="flex items-center gap-4">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Live transcript</h2>
        <div className="relative h-5 flex-1" aria-hidden>
          <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
          {s.segments.map((g) => (
            <span
              key={g.id}
              className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full"
              style={{
                left: `${(g.startMs / end) * 100}%`,
                width: `${Math.max(0.6, ((g.endMs - g.startMs) / end) * 100)}%`,
                background: g.speaker === "verity" ? "#F2B084" : "color-mix(in srgb, var(--owned) 55%, white)",
              }}
            />
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-[11.5px]">
          <span className={cn("h-1.5 w-1.5 rounded-full", s.ended ? "bg-open" : "anim-blink bg-surface")} />
          {s.ended ? "Ended" : "Live"}
        </span>
      </div>

      <div ref={ref} className="mt-3 max-h-[240px] min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {lines.length === 0 && <p className="text-[13px] text-muted">The conversation appears here as it happens.</p>}
        {lines.map((g) => (
          <div key={g.id + (g.final ? "" : "p")} className="grid grid-cols-[44px_28px_84px_minmax(0,1fr)] items-start gap-2">
            <span className="pt-1 font-mono text-[11px] text-muted">{formatClock(g.startMs)}</span>
            <Avatar who={g.speaker} />
            <span className="pt-0.5 text-[13px] font-medium">{g.speaker === "verity" ? "Verity" : "Candidate"}</span>
            <p className={cn("text-[13.5px] leading-relaxed", !g.final && "text-ink-2")}>
              {g.text}
              {!g.final && <span className="anim-blink ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-muted" />}
            </p>
          </div>
        ))}
        {waiting && (
          <div className="grid grid-cols-[44px_28px_84px_minmax(0,1fr)] items-center gap-2 text-muted">
            <span className="font-mono text-[11px]">{formatClock(s.atMs)}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-[10px]">···</span>
            <span className="text-[13px] font-medium text-ink">Verity</span>
            <span className="text-[13px]">Listening…</span>
          </div>
        )}
      </div>

      {onAnswer && !s.ended && (
        <form onSubmit={submit} className="mt-3 flex gap-2 border-t border-line pt-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your answer…"
            className="h-10 flex-1 rounded-xl border border-line bg-bg/50 px-3.5 text-[14px] outline-none focus:border-ink/40"
            aria-label="Type your answer"
          />
          <button type="submit" className="h-10 rounded-xl bg-ink px-4 text-[13px] font-medium text-bg disabled:opacity-40" disabled={!draft.trim()}>
            Send
          </button>
        </form>
      )}
    </section>
  );
}

function Avatar({ who }: { who: "verity" | "candidate" }) {
  return who === "verity" ? (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-bg">V</span>
  ) : (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F6E3CF] text-[11px] font-semibold text-[#9A5A22]">C</span>
  );
}
