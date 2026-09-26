import type { SessionState } from "@verity/contracts";
import { BeliefRing } from "@/components/case/belief-ring";
import { BeliefBars } from "@/components/board/panels";
import { HYP_LABEL, STATUS_COLOR, STATUS_LABEL } from "@/lib/hypotheses";
import { cn } from "@/lib/utils";

type Facet = { name: string; state: "evidenced" | "asking" | "pending" };

/**
 * The active case as a small tree: the case at the root, its technologies and
 * metrics as facets. A facet turns green once a receipt quote on this case
 * mentions it, amber while the current question is about it.
 */
function facets(s: SessionState, caseId: string): Facet[] {
  const c = s.cases[caseId]!;
  const quotes = c.receiptIds.map((id) => s.receipts[id]?.quote.toLowerCase() ?? "").join(" ");
  const answers = s.segments.filter((g) => g.speaker === "candidate").map((g) => g.text.toLowerCase());
  const q = s.questionOrder.length ? s.questions[s.questionOrder.at(-1)!] : null;
  const qText = q?.caseId === caseId ? q.text.toLowerCase() : "";
  const names = Array.from(new Set([...c.technologies, ...c.metrics])).slice(0, 5);
  return names.map((name) => {
    const n = name.toLowerCase();
    const token = n.split(/[\s·]+/)[0]!;
    if (quotes.includes(token)) return { name, state: "evidenced" };
    if (qText.includes(token) || answers.some((a) => a.includes(token))) return { name, state: "asking" };
    return { name, state: "pending" };
  });
}

const FACET_DOT = { evidenced: "var(--owned)", asking: "var(--surface)", pending: "var(--line-strong)" };

export function InvestigationPanel({ s }: { s: SessionState }) {
  const c = s.activeCaseId ? s.cases[s.activeCaseId] : null;
  const q = s.questionOrder.length ? s.questions[s.questionOrder.at(-1)!] : null;
  const fs = c ? facets(s, c.id) : [];
  const top = fs.slice(0, 3);
  const bottom = fs.slice(3, 5);

  return (
    <aside className="card flex flex-col p-4">
      <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Live investigation</h2>
      {!c ? (
        <p className="mt-4 text-[13px] text-muted">The case under investigation appears here.</p>
      ) : (
        <>
          <div className="relative mt-5 flex flex-col items-center">
            <Node title={c.label} sub={STATUS_LABEL[c.status]} dot={c.provisional ? "var(--surface)" : STATUS_COLOR[c.status]} strong ring={<BeliefRing belief={c.belief} size={26} stroke={4} provisional={c.provisional} status={c.status} />} />
            {top.length > 0 && <Connector count={top.length} />}
            <div className="flex w-full justify-center gap-2">
              {top.map((f) => (
                <Node key={f.name} title={f.name} dot={FACET_DOT[f.state]} highlight={f.state === "asking"} />
              ))}
            </div>
            {bottom.length > 0 && <Connector count={bottom.length} />}
            <div className="flex w-full justify-center gap-2">
              {bottom.map((f) => (
                <Node key={f.name} title={f.name} dot={FACET_DOT[f.state]} highlight={f.state === "asking"} />
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-line bg-bg/60 p-4 pt-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-medium">
                <span className="h-2 w-2 rounded-full bg-surface" />
                Current focus
              </span>
              <span className="text-[11.5px] text-muted" title={q?.why}>
                Why this question?
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <p className="text-[16px] font-semibold tracking-[-0.02em]">{c.label}</p>
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                style={{ background: `color-mix(in srgb, ${c.provisional ? "var(--surface)" : STATUS_COLOR[c.status]} 14%, transparent)`, color: c.provisional ? "#9a6a12" : STATUS_COLOR[c.status] }}
              >
                {c.provisional ? "Updating" : c.status === "INVESTIGATING" ? "Unresolved" : STATUS_LABEL[c.status]}
              </span>
            </div>
            {q?.why && <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{q.why}</p>}
            {s.observations.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-line pt-2">
                {s.observations.slice(-3).map((obs) => (
                  <li key={obs.id} className="text-[11.5px] leading-snug text-muted">
                    {obs.detail}
                  </li>
                ))}
              </ul>
            )}
            {q?.tiedPair && (
              <p className="mt-2 text-[11.5px] text-muted">
                Separating {HYP_LABEL[q.tiedPair[0]]} from {HYP_LABEL[q.tiedPair[1]]}
              </p>
            )}
            <BeliefBars belief={c.belief} />
          </div>
        </>
      )}
    </aside>
  );
}

function Node({ title, sub, dot, strong, highlight, ring }: { title: string; sub?: string; dot: string; strong?: boolean; highlight?: boolean; ring?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-w-0 max-w-[140px] items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-[var(--shadow-card)] transition-colors duration-300",
        highlight ? "border-[#F1D9BF] bg-[#FBF1E6]" : "border-line",
        strong && "max-w-[200px] px-3.5 py-2.5",
      )}
    >
      {ring ?? <span className="h-2 w-2 shrink-0 rounded-full transition-colors duration-500" style={{ background: dot }} />}
      <span className="min-w-0">
        <span className={cn("block truncate text-[12px] font-medium", strong && "text-[13px]")}>{title}</span>
        {sub && <span className="block truncate text-[11px] text-muted">{sub}</span>}
      </span>
    </div>
  );
}

function Connector({ count }: { count: number }) {
  const xs = count === 1 ? [50] : count === 2 ? [30, 70] : [16, 50, 84];
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full text-line-strong" aria-hidden>
      {xs.map((x) => (
        <path key={x} d={`M50 0 C 50 14, ${x} 12, ${x} 28`} fill="none" stroke="currentColor" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
