"use client";

import { useEffect, useRef } from "react";
import type { Belief, Observation, Receipt, SessionState } from "@verity/contracts";
import { BeliefRing } from "@/components/case/belief-ring";
import { HYP_COLOR, HYP_LABEL, STATUS_LABEL } from "@/lib/hypotheses";
import { cn, formatClock } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  opening: "Opening",
  ownership: "Ownership",
  mechanism: "Mechanism",
  counterfactual: "Counterfactual",
  scaffold: "Scaffold",
  reconcile: "Reconcile",
  reply: "Right of reply",
  closing: "Closing",
};

export function NowPanel({ s }: { s: SessionState }) {
  const c = s.activeCaseId ? s.cases[s.activeCaseId] : null;
  const q = s.questionOrder.length ? s.questions[s.questionOrder.at(-1)!] : null;
  if (!c || !q) {
    return (
      <Panel title="Now">
        <p className="text-[13px] text-muted">Waiting for the first question.</p>
      </Panel>
    );
  }
  return (
    <Panel title="Now">
      <div className="flex items-center gap-3">
        <BeliefRing belief={c.belief} size={56} provisional={c.provisional} status={c.status} conflict={c.conflict} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-[-0.02em]">{c.label}</p>
          <p className="text-[12px] text-muted">{c.provisional ? "Updating while they speak" : STATUS_LABEL[c.status]}</p>
        </div>
      </div>
      <BeliefBars belief={c.belief} />
      <div className="mt-4 space-y-3 border-t border-line pt-4">
        <Row label="Question">
          <span className="rounded-md bg-bg-sunk px-1.5 py-0.5 font-mono text-[11px]">{KIND_LABEL[q.kind]}</span>
        </Row>
        {q.tiedPair && (
          <Row label="Separating">
            <span className="flex items-center gap-1.5 text-[12.5px]">
              <Dot h={q.tiedPair[0]} /> {HYP_LABEL[q.tiedPair[0]]}
              <span className="text-muted">vs</span>
              <Dot h={q.tiedPair[1]} /> {HYP_LABEL[q.tiedPair[1]]}
            </span>
          </Row>
        )}
        <p className="text-[13.5px] leading-snug text-ink-2">“{q.text}”</p>
        <p className="text-[12px] leading-relaxed text-muted">
          <span className="font-medium text-ink-2">Why this question: </span>
          {q.why}
        </p>
      </div>
    </Panel>
  );
}

function Dot({ h }: { h: keyof Belief }) {
  return <span className="h-2 w-2 rounded-full" style={{ background: HYP_COLOR[h] }} />;
}

export function BeliefBars({ belief }: { belief: Belief }) {
  return (
    <div className="mt-4 space-y-1.5">
      {(["owned", "contributed", "surface"] as const).map((h) => (
        <div key={h} className="flex items-center gap-2 text-[11.5px]">
          <span className="w-[74px] text-muted">{HYP_LABEL[h]}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-sunk">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${belief[h] * 100}%`, background: HYP_COLOR[h] }} />
          </div>
          <span className="w-8 text-right font-mono text-[10.5px] text-muted">{Math.round(belief[h] * 100)}</span>
        </div>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11.5px] text-muted">{label}</span>
      {children}
    </div>
  );
}

export function Panel({ title, right, children, className }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("card flex min-h-0 flex-col p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="eyebrow">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Transcript({ s, highlight, className }: { s: SessionState; highlight?: string | null; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const lines = [...s.segments, ...(s.partial ? [s.partial] : [])];
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, s.partial?.text]);
  return (
    <div ref={ref} className={cn("min-h-0 space-y-3 overflow-y-auto pr-1", className)}>
      {lines.length === 0 && <p className="text-[13px] text-muted">Transcript appears here as the interview runs.</p>}
      {lines.map((seg) => (
        <div key={seg.id + (seg.final ? "" : "p")} className="flex gap-3">
          <span className="w-[42px] shrink-0 pt-0.5 font-mono text-[10.5px] text-muted">{formatClock(seg.startMs)}</span>
          <div className="min-w-0">
            <p className={cn("text-[11px] font-medium", seg.speaker === "verity" ? "text-contributed" : "text-ink-2")}>
              {seg.speaker === "verity" ? "Verity" : "Candidate"}
            </p>
            <p className={cn("text-[13.5px] leading-relaxed", !seg.final && "text-muted")}>
              <Highlighted text={seg.text} quote={highlight} />
              {!seg.final && <span className="anim-blink ml-0.5 inline-block h-3 w-[2px] translate-y-0.5 bg-muted" />}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Highlighted({ text, quote }: { text: string; quote?: string | null }) {
  if (!quote) return <>{text}</>;
  const i = text.indexOf(quote);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-owned/15 px-0.5 text-ink">{quote}</mark>
      {text.slice(i + quote.length)}
    </>
  );
}

export function ReceiptCard({ r, label, onPlay, compact }: { r: Receipt; label?: string; onPlay?: (r: Receipt) => void; compact?: boolean }) {
  const delta = r.after.owned - r.before.owned;
  const lead = (["owned", "contributed", "surface"] as const).reduce((a, h) => (r.after[h] - r.before[h] > r.after[a] - r.before[a] ? h : a), "owned" as keyof Belief);
  const shift = r.after[lead] - r.before[lead];
  return (
    <article className={cn("rounded-xl border border-line bg-card p-3", !compact && "p-4")}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[11.5px] text-muted">
          {label && <span className="font-medium text-ink-2">{label}</span>}
          <span className="rounded bg-bg-sunk px-1.5 py-0.5 font-mono text-[10px] uppercase">{r.type.replace("_", " ")}</span>
        </span>
        <span className="font-mono text-[11px]" style={{ color: HYP_COLOR[lead] }}>
          {shift >= 0 ? "+" : ""}
          {Math.round(shift * 100)} {HYP_LABEL[lead]}
        </span>
      </div>
      <p className="mt-2 text-[13.5px] leading-snug text-ink">“{r.quote}”</p>
      {!compact && <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{r.rationale}</p>}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onPlay?.(r)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-2 transition hover:border-ink/40"
        >
          <svg width="10" height="10" viewBox="0 0 12 12"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>
          {formatClock(r.clip.startMs)}–{formatClock(r.clip.endMs)}
        </button>
        <span className="flex items-center gap-1.5">
          <BeliefRing belief={r.before} size={20} stroke={3} />
          <svg width="12" height="12" viewBox="0 0 16 16" className="text-muted"><path d="M3 8h9m-3.5-4L12 8l-3.5 4" stroke="currentColor" strokeWidth="1.4" fill="none" /></svg>
          <BeliefRing belief={r.after} size={20} stroke={3} />
        </span>
      </div>
      <span className="sr-only">Owned changed by {Math.round(delta * 100)} points</span>
    </article>
  );
}

export function ObservationRail({ observations, durationMs, t }: { observations: Observation[]; durationMs: number; t?: number }) {
  return (
    <div className="relative h-6">
      <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
      {t !== undefined && <div className="absolute top-0 h-full w-px bg-ink/60" style={{ left: `${(t / durationMs) * 100}%` }} />}
      {observations.map((o) => (
        <span
          key={o.id}
          title={`${formatClock(o.startMs)} · ${o.detail}`}
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-open"
          style={{ left: `${(o.startMs / durationMs) * 100}%` }}
        />
      ))}
    </div>
  );
}
