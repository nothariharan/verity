import type { Belief, CaseStatus } from "@verity/contracts";
import { BeliefRing } from "@/components/case/belief-ring";
import { Button, DemoBadge, Pill } from "@/components/ui/primitives";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/hypotheses";
import { ReceiptTile } from "./icon-tiles";
import { Container, SectionHeading } from "./section";
import { Reveal } from "./reveal";

const COUNTS = [
  { label: "Owned", n: 3, color: "var(--owned)" },
  { label: "Contributed", n: 2, color: "var(--contributed)" },
  { label: "Surface", n: 1, color: "var(--surface)" },
  { label: "Open", n: 1, color: "var(--open)" },
];

const CASES: { label: string; belief: Belief; status: CaseStatus; receipts: number }[] = [
  { label: "Kafka · 50k ev/s", belief: { owned: 0.74, contributed: 0.2, surface: 0.06 }, status: "SETTLED_OWNED", receipts: 3 },
  { label: "Led on-call rotation", belief: { owned: 0.68, contributed: 0.24, surface: 0.08 }, status: "SETTLED_OWNED", receipts: 2 },
  { label: "RAG · 100k docs", belief: { owned: 0.2, contributed: 0.66, surface: 0.14 }, status: "SETTLED_CONTRIBUTED", receipts: 2 },
  { label: "40% latency cut", belief: { owned: 0.1, contributed: 0.22, surface: 0.68 }, status: "SETTLED_SURFACE", receipts: 2 },
  { label: "Postgres migration", belief: { owned: 0.38, contributed: 0.36, surface: 0.26 }, status: "OPEN", receipts: 1 },
];

export function DossierPreview() {
  return (
    <section id="dossier" aria-labelledby="dossier-title" className="scroll-mt-28 border-t md:scroll-mt-16 border-line py-28 sm:py-36">
      <Container className="grid items-center gap-14 md:grid-cols-[1fr_minmax(0,560px)] md:gap-16">
        <div>
          <SectionHeading
            id="dossier-title"
            eyebrow="The dossier"
            title={
              <>
                Everything the interview <ReceiptTile /> established.
              </>
            }
            body="Each claim, where it ended up, and the receipts behind it. Click any receipt to hear the exact clip. The record is hash-chained, so you can check it hasn't been edited."
          />
          <div className="mt-9">
            <Button href="/app" variant="ghost" arrow>
              Open the demo dashboard
            </Button>
          </div>
        </div>

        <Reveal>
          <article className="card overflow-hidden" aria-label="Example dossier">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
              <div>
                <p className="text-[16px] font-semibold tracking-[-0.02em]">Example candidate</p>
                <p className="text-[13px] text-muted">Senior Backend Engineer · 7 cases</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill color="var(--owned)">Record intact</Pill>
                <DemoBadge />
              </div>
            </header>

            <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-line bg-bg px-6 py-3.5 text-[13.5px]">
              <span className="eyebrow self-center">Example</span>
              {COUNTS.map((c) => (
                <span key={c.label} className="inline-flex items-center gap-1.5 text-ink-2">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.label} <span className="font-semibold text-ink">{c.n}</span>
                </span>
              ))}
            </div>

            <ul className="divide-y divide-line">
              {CASES.map((c) => (
                <li key={c.label} className="flex items-center gap-4 px-6 py-3.5">
                  <BeliefRing belief={c.belief} status={c.status} size={36} />
                  <p className="min-w-0 flex-1 truncate text-[14.5px] font-medium">{c.label}</p>
                  <span className="text-[13px] font-medium" style={{ color: STATUS_COLOR[c.status] }}>
                    {STATUS_LABEL[c.status]}
                  </span>
                  <span className="hidden w-20 text-right font-mono text-[11.5px] text-muted sm:inline">
                    {c.receipts} {c.receipts === 1 ? "receipt" : "receipts"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-6 py-3 text-[12.5px] text-muted">+ 2 more cases</p>
          </article>
        </Reveal>
      </Container>
    </section>
  );
}
