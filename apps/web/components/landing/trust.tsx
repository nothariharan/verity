import { DemoBadge } from "@/components/ui/primitives";
import { ShieldTile } from "./icon-tiles";
import { Container, SectionHeading } from "./section";
import { Reveal } from "./reveal";

const EVENTS = [
  { at: "00:14", label: "Tab hidden", detail: "during Q2 · Kafka · 50k ev/s" },
  { at: "00:19", label: "Returned", detail: "away 5.1 s" },
  { at: "11:02", label: "Tab hidden", detail: "during Q7 · 40% latency cut" },
  { at: "11:04", label: "Returned", detail: "away 2.3 s" },
];

const PRINCIPLES = [
  "Signals are timestamped observations, shown next to the question they happened during.",
  "There is no cheating probability, rank, or flag attached to a person.",
  "Nothing is inferred from face, voice tone, or accent. Camera signals are off by default.",
];

export function Trust() {
  return (
    <section id="trust" aria-labelledby="trust-title" className="scroll-mt-28 border-t lg:scroll-mt-16 border-line py-28 sm:py-36">
      <Container className="grid items-start gap-14 md:grid-cols-2 md:gap-16">
        <div>
          <SectionHeading
            id="trust-title"
            eyebrow="Integrity"
            title={
              <>
                Trust without <ShieldTile /> surveillance.
              </>
            }
            body="Verity notes what happened and when. It doesn't decide what it means. That call stays with a person who can see the context."
          />
          <ul className="mt-10 space-y-4">
            {PRINCIPLES.map((p) => (
              <li key={p} className="flex gap-3 text-[16px] leading-relaxed text-ink-2">
                <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0" fill="none" aria-hidden>
                  <path d="m3.5 8.5 3 3 6-7" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <Reveal>
          <div className="card p-6 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <p className="eyebrow">Observations</p>
              <DemoBadge />
            </div>
            <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-line">
              {EVENTS.map((e) => (
                <li key={`${e.at}-${e.label}`} className="relative flex items-baseline gap-4 pl-7">
                  <span aria-hidden className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-card bg-open" />
                  <span className="w-12 shrink-0 font-mono text-[12.5px] text-muted">{e.at}</span>
                  <div>
                    <p className="text-[15px] font-medium text-ink">{e.label}</p>
                    <p className="text-[13px] text-muted">{e.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-xl border border-dashed border-line-strong bg-bg px-4 py-3 text-[13.5px] text-ink-2">
              Observations only, not evidence of misconduct.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
