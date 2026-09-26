import type { Case } from "@verity/contracts";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/hypotheses";
import { cn } from "@/lib/utils";

function sublabel(c: Case) {
  const bits = [...c.metrics, ...c.technologies].slice(0, 3);
  return bits.length ? bits.join(", ") : c.claim;
}

export function PlanPanel({ cases, activeId, ended, reveal }: { cases: Case[]; activeId: string | null; ended: boolean; reveal: boolean }) {
  const explored = cases.filter((c) => c.status !== "UNTOUCHED").length;
  return (
    <aside className="card flex min-h-0 flex-col p-4 lg:row-span-1">
      <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Investigation plan</h2>
      <p className="mt-1 text-[11.5px] text-muted">
        {explored} / {cases.length} claims explored
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-sunk">
        <div className="h-full rounded-full bg-owned transition-[width] duration-700" style={{ width: `${cases.length ? (explored / cases.length) * 100 : 0}%` }} />
      </div>
      <ul className="mt-3 flex min-h-0 flex-col gap-1.5 overflow-y-auto">
        {cases.map((c) => {
          const active = c.id === activeId && !ended;
          const status = ended && c.status === "INVESTIGATING" ? "OPEN" : c.status;
          const settled = status.startsWith("SETTLED");
          const dot = !reveal
            ? c.status === "UNTOUCHED" ? "var(--line-strong)" : "var(--ink)"
            : active ? "var(--surface)" : settled || status === "OPEN" ? STATUS_COLOR[status] : "var(--line-strong)";
          return (
            <li
              key={c.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300",
                active ? "border-[#F1D9BF] bg-[#FBF1E6]" : "border-transparent hover:bg-bg/70",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", active && "anim-blink")} style={{ background: dot }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{c.label}</p>
                <p className="truncate text-[11px] text-muted">{sublabel(c)}</p>
              </div>
              {active ? (
                <svg width="14" height="14" viewBox="0 0 16 16" className="text-ink-2"><path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
              ) : c.status !== "UNTOUCHED" && (settled || !reveal) ? (
                <svg width="14" height="14" viewBox="0 0 16 16" className="text-ink-2" aria-label={reveal ? STATUS_LABEL[status] : "Discussed"}>
                  <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-line-strong" aria-label={reveal ? STATUS_LABEL[status] : "Not yet discussed"} />
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
