"use client";

import type { Receipt, SessionState } from "@verity/contracts";
import { HYP_COLOR, HYP_LABEL } from "@/lib/hypotheses";
import { formatClock } from "@/lib/utils";

export function EvidencePanel({ s, onPlay }: { s: SessionState; onPlay?: (r: Receipt) => void }) {
  const receipts = [...s.receiptOrder].reverse().map((id) => s.receipts[id]!);
  return (
    <section className="card flex min-h-[260px] flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Key evidence</h2>
        <span className="rounded-md bg-owned/12 px-2 py-0.5 text-[11px] font-medium text-owned">Receipts · {receipts.length}</span>
      </div>
      <ul className="mt-3 max-h-[260px] min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {receipts.length === 0 && <li className="text-[13px] text-muted">Each belief change leaves a receipt with the exact clip.</li>}
        {receipts.map((r) => {
          const lead = (["owned", "contributed", "surface"] as const).reduce((a, h) => (r.after[h] - r.before[h] > r.after[a] - r.before[a] ? h : a), "owned" as const);
          const label = s.cases[r.caseId]?.label.split(" · ")[0] ?? "";
          return (
            <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-card p-2.5">
              <button
                type="button"
                onClick={() => onPlay?.(r)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-sunk text-ink transition hover:bg-line"
                aria-label={`Play clip ${formatClock(r.clip.startMs)} to ${formatClock(r.clip.endMs)}`}
              >
                <svg width="11" height="11" viewBox="0 0 12 12"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] text-muted">
                    {formatClock(r.clip.startMs)} – {formatClock(r.clip.endMs)}
                  </span>
                  <MiniWave seed={r.id} />
                </div>
                <p className="truncate text-[12.5px]">“{r.quote}”</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded-md bg-bg-sunk px-1.5 py-0.5 text-[10.5px] text-ink-2">{label}</span>
                <span className="font-mono text-[10px]" style={{ color: HYP_COLOR[lead] }}>
                  +{Math.round((r.after[lead] - r.before[lead]) * 100)} {HYP_LABEL[lead]}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MiniWave({ seed }: { seed: string }) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const bars = Array.from({ length: 22 }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    return 2 + ((h >> 16) % 9) * Math.sin(((i + 1) / 23) * Math.PI);
  });
  return (
    <svg width="66" height="12" viewBox="0 0 66 12" className="text-muted/60" aria-hidden>
      {bars.map((b, i) => (
        <rect key={i} x={i * 3} y={6 - b / 2} width="1.6" height={b} rx="0.8" fill="currentColor" />
      ))}
    </svg>
  );
}
