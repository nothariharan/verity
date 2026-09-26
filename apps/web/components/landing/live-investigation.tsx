import { BeliefRing } from "@/components/case/belief-ring";
import { DemoBadge } from "@/components/ui/primitives";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/hypotheses";
import { AskTile } from "./icon-tiles";
import { Container, SectionHeading } from "./section";
import { Reveal } from "./reveal";

const TIED = { owned: 0.41, contributed: 0.43, surface: 0.16 };

const SIDE_CASES = [
  { label: "RAG · 100k docs", belief: { owned: 0.2, contributed: 0.66, surface: 0.14 }, status: "SETTLED_CONTRIBUTED" as const },
  { label: "40% latency cut", belief: { owned: 0.34, contributed: 0.33, surface: 0.33 }, status: "UNTOUCHED" as const },
];

export function LiveInvestigation() {
  return (
    <section id="live" aria-labelledby="live-title" className="scroll-mt-28 border-t lg:scroll-mt-16 border-line py-28 sm:py-36">
      <Container>
        <SectionHeading
          id="live-title"
          eyebrow="Live investigation"
          title={
            <>
              The question changes with the <AskTile /> answer.
            </>
          }
          body="Verity picks the case where one question would move the belief most, then asks the question that best separates the two explanations still tied. No fixed script, no quiz bank."
        />

        <Reveal className="mt-16">
          <div className="card grid overflow-hidden md:grid-cols-[1.05fr_1fr]">
            {/* board fragment */}
            <div className="border-b border-line p-6 sm:p-8 md:border-b-0 md:border-r">
              <div className="mb-6 flex items-center justify-between">
                <p className="eyebrow">Case board</p>
                <DemoBadge />
              </div>
              <div className="flex items-center gap-5">
                <BeliefRing belief={TIED} size={104} active provisional status="INVESTIGATING">
                  <span className="font-mono text-[10px] text-muted">tied</span>
                </BeliefRing>
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold tracking-[-0.02em]">Kafka · 50k ev/s</p>
                  <p className="text-[13px] text-muted">Investigating · 2 questions so far</p>
                </div>
              </div>

              <div className="mt-7 rounded-xl border border-line bg-bg p-4">
                <p className="mb-3 text-[13px] font-medium text-ink">
                  Tied pair: <span className="text-owned">Owned</span> vs <span className="text-contributed">Contributed</span>
                </p>
                <TieBar label="Owned" value={TIED.owned} color="var(--owned)" />
                <TieBar label="Contributed" value={TIED.contributed} color="var(--contributed)" />
                <TieBar label="Surface" value={TIED.surface} color="var(--surface)" muted />
              </div>

              <ul className="mt-6 grid grid-cols-2 gap-3">
                {SIDE_CASES.map((c) => (
                  <li key={c.label} className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5">
                    <BeliefRing belief={c.belief} size={34} status={c.status} />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium">{c.label}</p>
                      <p className="text-[11px]" style={{ color: c.status === "UNTOUCHED" ? "var(--muted)" : STATUS_COLOR[c.status] }}>
                        {STATUS_LABEL[c.status]}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* why this question */}
            <div className="flex flex-col p-6 sm:p-8">
              <p className="eyebrow mb-4">Next question</p>
              <p className="rounded-2xl rounded-tl-sm bg-ink px-4 py-3 text-[16px] leading-snug text-bg">
                Who chose user_id as the partition key, and what did that choice cost you?
              </p>

              <div className="mt-6">
                <p className="text-[13px] font-semibold text-ink">Why this question</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                  Owned and Contributed both fit the answers so far. Someone who owned the design can explain why the key
                  was chosen and what it gave up. Someone who contributed usually describes how it behaved.
                </p>
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-[13px] font-semibold text-ink">Considered, not asked</p>
                <ul className="mt-2 space-y-2 text-[14px] text-muted">
                  <li className="flex gap-2">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                    “What is a consumer group?” Tests vocabulary; doesn&apos;t separate the tied pair.
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                    “Tell me about the RAG project.” That case is already settled.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function TieBar({ label, value, color, muted }: { label: string; value: number; color: string; muted?: boolean }) {
  return (
    <div className={muted ? "mt-2 opacity-60" : "mt-2"}>
      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0 text-[12px] text-ink-2">{label}</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-sunk">
          <span className="block h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
        </span>
      </div>
    </div>
  );
}
