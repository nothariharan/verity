import type { Belief, CaseStatus } from "@verity/contracts";
import { BeliefRing } from "@/components/case/belief-ring";
import { HYP_BLURB } from "@/lib/hypotheses";
import { cn } from "@/lib/utils";
import { RingTile } from "./icon-tiles";
import { Container, SectionHeading } from "./section";
import { Reveal } from "./reveal";

const OUTCOMES: { key: "owned" | "contributed" | "surface" | "open"; label: string; color: string; belief: Belief; status: CaseStatus }[] = [
  { key: "owned", label: "Owned", color: "var(--owned)", belief: { owned: 0.76, contributed: 0.18, surface: 0.06 }, status: "SETTLED_OWNED" },
  { key: "contributed", label: "Contributed", color: "var(--contributed)", belief: { owned: 0.18, contributed: 0.7, surface: 0.12 }, status: "SETTLED_CONTRIBUTED" },
  { key: "surface", label: "Surface", color: "var(--surface)", belief: { owned: 0.06, contributed: 0.2, surface: 0.74 }, status: "SETTLED_SURFACE" },
  { key: "open", label: "Open", color: "var(--open)", belief: { owned: 0.38, contributed: 0.36, surface: 0.26 }, status: "OPEN" },
];

export function Resolution() {
  return (
    <section aria-labelledby="resolution-title" className="border-t border-line bg-bg-sunk/50 py-28 sm:py-36">
      <Container>
        <SectionHeading
          id="resolution-title"
          eyebrow="Resolution"
          align="center"
          title={
            <>
              Claims don&apos;t get scores. They get <RingTile /> resolved.
            </>
          }
          body="Every case ends in one of four plain states, each backed by receipts. None of them is a grade."
        />

        <Reveal className="mt-16 grid border-y border-line-strong sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {OUTCOMES.map((o, i) => (
            <div
              key={o.key}
              className={cn(
                "flex flex-col items-center border-line px-6 py-10 text-center",
                i > 0 && "border-t sm:border-t-0",
                i % 2 === 1 && "sm:border-l",
                i >= 2 && "sm:border-t lg:border-t-0",
                i === 2 && "lg:border-l",
              )}
            >
              <BeliefRing belief={o.belief} status={o.status} size={132} stroke={10}>
                <span className="text-[13px] font-semibold" style={{ color: o.color }}>
                  {o.label}
                </span>
              </BeliefRing>
              <h3 className="mt-6 text-[22px] font-semibold tracking-[-0.025em]" style={{ color: o.color }}>
                {o.label}
              </h3>
              <p className="mt-2 max-w-[16rem] text-[15.5px] leading-relaxed text-muted">{HYP_BLURB[o.key]}</p>
            </div>
          ))}
        </Reveal>

        <p className="mx-auto mt-10 max-w-xl text-center text-[15px] leading-relaxed text-muted">
          Forgetting is not lying. “I don&apos;t remember” never counts against a claim on its own, and a contradiction is only
          flagged after two cited statements conflict and a polite follow-up doesn&apos;t reconcile them.
        </p>
      </Container>
    </section>
  );
}
