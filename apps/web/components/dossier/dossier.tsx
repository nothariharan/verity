"use client";

import { useMemo, useState } from "react";
import { playCandidateClip } from "@/lib/clip-playback";
import { reduceAll, type CaseStatus, type Receipt, type VerityEvent } from "@verity/contracts";
import { BeliefRing } from "@/components/case/belief-ring";
import { Panel, ReceiptCard, Transcript } from "@/components/board/panels";
import { DemoBadge, Pill } from "@/components/ui/primitives";
import { HYP_BLURB, STATUS_COLOR, STATUS_LABEL } from "@/lib/hypotheses";
import { finalStatus, orderedCases } from "@/lib/session";
import { cn, formatClock } from "@/lib/utils";

const COUNT_ORDER: { key: CaseStatus; label: string }[] = [
  { key: "SETTLED_OWNED", label: "Owned" },
  { key: "SETTLED_CONTRIBUTED", label: "Contributed" },
  { key: "SETTLED_SURFACE", label: "Surface" },
  { key: "OPEN", label: "Open" },
];

export function Dossier({
  events,
  demo,
  practice,
  chain,
  sessionId,
}: {
  events: readonly VerityEvent[];
  demo?: boolean;
  practice?: boolean;
  chain?: { ok: boolean; count: number } | null;
  sessionId?: string;
}) {
  const full = useMemo(() => reduceAll(events), [events]);
  const end = events.at(-1)?.atMs ?? 0;
  const [t, setT] = useState(end);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [clipNote, setClipNote] = useState<string | null>(null);
  const atT = useMemo(() => reduceAll(events, t), [events, t]);
  const ended = !!full.ended;
  const cases = orderedCases(full);
  const asked = cases.filter((c) => c.status !== "UNTOUCHED");
  const counts = COUNT_ORDER.map((k) => ({ ...k, n: asked.filter((c) => finalStatus(c, ended) === k.key).length }));
  const conflicts = cases.filter((c) => c.conflict).length;
  const receipts = full.receiptOrder.map((id) => full.receipts[id]!);

  const play = (r: Receipt) => {
    setT(r.clip.endMs + 1200);
    setHighlight(r.quote);
    setClipNote(null);
    document.getElementById("dossier-transcript")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (!sessionId || demo) return;
    void playCandidateClip(sessionId, r.clip.startMs, r.clip.endMs).then((ok) => {
      if (!ok) setClipNote("This session has no recorded answer to play.");
    });
  };

  const deeper = asked.filter((c) => ["OPEN", "SETTLED_SURFACE"].includes(finalStatus(c, ended)));

  return (
    <div className="space-y-5 px-4 pb-16 pt-6 md:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-2">
            {practice ? "Practice report" : "Dossier"} {demo && <DemoBadge />}
          </p>
          <h1 className="headline mt-1 text-[30px] md:text-[34px]">
            {full.meta?.candidateName ?? "Candidate"} <span className="text-muted">· {full.meta?.role}</span>
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            {formatClock(end)} interview · {asked.length} of {cases.length} claims investigated · {receipts.length} receipts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {counts.map((c) => (
            <Pill key={c.key} color={STATUS_COLOR[c.key]}>
              {c.label} {c.n}
            </Pill>
          ))}
          <Pill color={conflicts ? "var(--conflict)" : "var(--line-strong)"}>Conflicts {conflicts}</Pill>
          <ChainChip demo={demo} chain={chain} events={events.length} />
        </div>
      </header>

      <p className="text-[12.5px] text-muted">No overall score. Each claim is resolved on its own evidence, and every change links to a receipt below.</p>

      <Panel title="Time scrubber" right={<span className="font-mono text-[12px]">{formatClock(t)}</span>}>
        <div className="relative">
          <input
            type="range"
            min={0}
            max={end}
            value={t}
            onChange={(e) => {
              setT(Number(e.target.value));
              setHighlight(null);
            }}
            className="w-full accent-[var(--ink)]"
            aria-label="Replay the board at a moment in the interview"
          />
          <div className="pointer-events-none relative h-3">
            {receipts.map((r) => (
              <span key={r.id} className="absolute top-0 h-3 w-px bg-ink/40" style={{ left: `${(r.clip.startMs / Math.max(end, 1)) * 100}%` }} />
            ))}
          </div>
        </div>
        {clipNote && <p className="mt-2 text-[12.5px] text-muted">{clipNote}</p>}
        <div className="mt-3 flex flex-wrap gap-4">
          {orderedCases(atT).map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <BeliefRing belief={c.belief} size={30} stroke={4} provisional={c.provisional} status={c.status} />
              <span className="text-[12px] text-ink-2">{c.label}</span>
            </div>
          ))}
        </div>
      </Panel>

      {practice && deeper.length > 0 && (
        <Panel title="Where to go deeper">
          <ul className="grid gap-3 md:grid-cols-2">
            {deeper.map((c) => (
              <li key={c.id} className="rounded-xl border border-line p-4">
                <p className="text-[14px] font-medium">{c.label}</p>
                <p className="mt-1 text-[12.5px] text-muted">{HYP_BLURB[finalStatus(c, ended) === "OPEN" ? "open" : "surface"]}</p>
                <p className="mt-3 text-[13px] text-ink-2">Prepare for: “{full.questions[c.questionIds.at(-1)!]?.text ?? c.openingQuestion}”</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {asked.map((c) => {
            const st = finalStatus(c, ended);
            const rs = c.receiptIds.map((id) => full.receipts[id]).filter(Boolean) as Receipt[];
            return (
              <article key={c.id} className="card p-5">
                <div className="flex flex-wrap items-start gap-5">
                  <BeliefRing belief={c.belief} size={96} status={c.status} conflict={c.conflict}>
                    <span className="text-[11px] font-medium" style={{ color: STATUS_COLOR[st] }}>
                      {STATUS_LABEL[st]}
                    </span>
                  </BeliefRing>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[18px] font-semibold tracking-[-0.02em]">{c.label}</h3>
                    <p className="mt-1 text-[13px] text-muted">Resume: “{c.claim}”</p>
                    <p className="mt-2 text-[12.5px] text-ink-2">{HYP_BLURB[st === "SETTLED_OWNED" ? "owned" : st === "SETTLED_CONTRIBUTED" ? "contributed" : st === "SETTLED_SURFACE" ? "surface" : "open"]}</p>
                    <ol className="mt-4 space-y-1.5 border-l border-line pl-4">
                      {c.questionIds.map((qid) => {
                        const q = full.questions[qid]!;
                        return (
                          <li key={qid} className="text-[13px]">
                            <span className="mr-2 font-mono text-[10.5px] uppercase text-muted">{q.kind}</span>
                            {q.text}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>
                {rs.length > 0 && (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {rs.map((r) => (
                      <ReceiptCard key={r.id} r={r} onPlay={play} />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
          {cases.filter((c) => c.status === "UNTOUCHED").length > 0 && (
            <div className="rounded-2xl border border-dashed border-line-strong p-5">
              <p className="eyebrow">Not investigated in this interview</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cases
                  .filter((c) => c.status === "UNTOUCHED")
                  .map((c) => (
                    <span key={c.id} className="rounded-full border border-line bg-card px-3 py-1 text-[12.5px] text-ink-2">
                      {c.label}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Panel title="Transcript" className="max-h-[560px]">
            <div id="dossier-transcript" />
            <Transcript s={atT} highlight={highlight} className="max-h-[480px]" />
            {demo && <p className="mt-3 border-t border-line pt-3 text-[11.5px] text-muted">Demo log has no audio. In live sessions the clip button plays the recorded answer.</p>}
          </Panel>
          <Panel title="Observations">
            {full.observations.length === 0 ? (
              <p className="text-[13px] text-muted">None recorded.</p>
            ) : (
              <ul className="space-y-2">
                {full.observations.map((o) => (
                  <li key={o.id} className="flex gap-3 text-[13px]">
                    <span className="font-mono text-[11px] text-muted">{formatClock(o.startMs)}</span>
                    {o.detail}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11.5px] text-muted">Observations only, not evidence of misconduct.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ChainChip({ demo, chain, events }: { demo?: boolean; chain?: { ok: boolean; count: number } | null; events: number }) {
  if (demo || !chain) {
    return <Pill color="var(--line-strong)">{demo ? `Scripted log · ${events} events` : "Verifying record…"}</Pill>;
  }
  return (
    <Pill color={chain.ok ? "var(--owned)" : "var(--conflict)"} className={cn(!chain.ok && "border-conflict/40")}>
      {chain.ok ? `Record intact · ${chain.count} events` : "Record altered after the interview"}
    </Pill>
  );
}
