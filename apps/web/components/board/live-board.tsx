"use client";

import type { SessionState } from "@verity/contracts";
import { DemoBadge, Pill } from "@/components/ui/primitives";
import { orderedCases } from "@/lib/session";
import { formatClock } from "@/lib/utils";
import { CaseGrid } from "./case-grid";
import { NowPanel, ObservationRail, Panel, ReceiptCard, Transcript } from "./panels";

const FLOOR: Record<string, { label: string; color: string }> = {
  LISTEN: { label: "Listening", color: "var(--contributed)" },
  ACK: { label: "Acknowledging", color: "var(--contributed)" },
  SPEAK: { label: "Verity speaking", color: "var(--ink)" },
  YIELD: { label: "Yielding", color: "var(--surface)" },
};

export function LiveBoard({
  s,
  t,
  durationMs,
  demo,
  controls,
  connection,
}: {
  s: SessionState;
  t: number;
  durationMs: number;
  demo?: boolean;
  controls?: React.ReactNode;
  connection?: string;
}) {
  const cases = orderedCases(s);
  const candidateSpeaking = !!s.partial && !s.ended;
  const floor = s.ended ? { label: "Ended", color: "var(--open)" } : candidateSpeaking ? { label: "Candidate speaking", color: "var(--owned)" } : FLOOR[s.voiceState]!;
  const receipts = [...s.receiptOrder].reverse().map((id) => s.receipts[id]!);

  return (
    <div className="flex h-full flex-col gap-4 px-4 pb-6 pt-5 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="eyebrow flex items-center gap-2">
              Live investigation {demo && <DemoBadge />}
            </p>
            <h1 className="headline mt-1 text-[24px]">
              {s.meta?.candidateName ?? "Candidate"} <span className="text-muted">· {s.meta?.role ?? "—"}</span>
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill color={floor.color} pulse={!s.ended}>
            {floor.label}
          </Pill>
          <span className="rounded-full border border-line bg-card px-2.5 py-1 font-mono text-[12px]">{formatClock(t)}</span>
          {connection && <span className="font-mono text-[11px] text-muted">{connection}</span>}
          {controls}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-0 flex-col gap-4">
          <Panel title={`Cases · ${cases.length}`} right={<Legend />}>
            <CaseGrid cases={cases} activeId={s.activeCaseId} ended={!!s.ended} />
          </Panel>
          <Panel title="Receipts" right={<span className="font-mono text-[11px] text-muted">{receipts.length}</span>} className="min-h-[220px]">
            {receipts.length === 0 ? (
              <p className="text-[13px] text-muted">Every belief change leaves a receipt here: the quote, the clip, and why it moved.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {receipts.slice(0, 6).map((r) => (
                  <ReceiptCard key={r.id} r={r} label={s.cases[r.caseId]?.label} compact />
                ))}
              </div>
            )}
          </Panel>
        </div>
        <div className="flex min-h-0 flex-col gap-4">
          <NowPanel s={s} />
          <Panel title="Transcript" className="max-h-[440px] min-h-[260px] flex-1">
            <Transcript s={s} />
          </Panel>
        </div>
      </div>

      <Panel title="Observations" right={<span className="text-[11px] text-muted">Neutral, timestamped. Not evidence of misconduct.</span>}>
        <ObservationRail observations={s.observations} durationMs={Math.max(durationMs, 1)} t={t} />
      </Panel>
    </div>
  );
}

function Legend() {
  return (
    <span className="hidden items-center gap-3 text-[11px] text-muted sm:flex">
      {(
        [
          ["Owned", "var(--owned)"],
          ["Contributed", "var(--contributed)"],
          ["Surface", "var(--surface)"],
        ] as const
      ).map(([l, c]) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: c }} />
          {l}
        </span>
      ))}
    </span>
  );
}
