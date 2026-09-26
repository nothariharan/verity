import type { Case } from "@verity/contracts";
import { BeliefRing } from "@/components/case/belief-ring";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/hypotheses";
import { cn } from "@/lib/utils";

/** Deterministic 2D layout: cases in importance order on a fixed grid. Nodes never move when beliefs change. */
export function CaseGrid({
  cases,
  activeId,
  ended,
  onSelect,
  selectedId,
}: {
  cases: Case[];
  activeId: string | null;
  ended?: boolean;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {cases.map((c) => {
        const active = c.id === activeId && !ended;
        const status = ended && c.status === "INVESTIGATING" ? "OPEN" : c.status;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect?.(c.id)}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-2xl border bg-card px-3 pb-3 pt-4 text-center transition-all duration-300",
              active ? "border-ink/80 shadow-[var(--shadow-float)]" : "border-line shadow-[var(--shadow-card)]",
              activeId && !active && !ended && "opacity-80",
              selectedId === c.id && "ring-2 ring-ink/70",
            )}
            aria-label={`${c.label}: ${STATUS_LABEL[status]}`}
          >
            <BeliefRing belief={c.belief} size={active ? 76 : 64} provisional={c.provisional} status={c.status} conflict={c.conflict} active={active}>
              <span className="font-mono text-[10px] text-muted">{c.status === "UNTOUCHED" ? "—" : `${Math.round(c.belief.owned * 100)}`}</span>
            </BeliefRing>
            <span className="line-clamp-1 text-[13px] font-medium tracking-[-0.01em]">{c.label}</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[status] }} />
              {c.provisional && !ended ? "Updating…" : STATUS_LABEL[status]}
              {c.probes > 0 && <span className="font-mono text-[10px] text-muted/80">· {c.probes}/{c.probeBudget}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
