import { BeliefRing } from "@/components/case/belief-ring";
import { DemoBadge } from "@/components/ui/primitives";
import { MiniWave, SETTLED } from "./artifacts";
import { ReceiptTile } from "./icon-tiles";
import { Container, SectionHeading } from "./section";
import { Reveal } from "./reveal";

const BEFORE = { owned: 0.41, contributed: 0.43, surface: 0.16 };

export function Receipts() {
  return (
    <section aria-labelledby="receipts-title" className="border-t border-line py-28 sm:py-36">
      <Container className="grid items-center gap-14 md:grid-cols-[1fr_minmax(0,520px)] md:gap-16">
        <div>
          <SectionHeading
            id="receipts-title"
            eyebrow="Receipts"
            title={
              <>
                Every assessment has a <ReceiptTile /> receipt.
              </>
            }
            body="When a belief moves, Verity writes down why: the exact words, the audio you can replay, the reasoning, and where the belief stood before and after. No receipt, no change."
          />
        </div>

        <Reveal>
          <article className="card p-6 sm:p-7" aria-label="Example receipt">
            <header className="flex items-center justify-between">
              <p className="eyebrow">Receipt · Kafka · 50k ev/s</p>
              <DemoBadge />
            </header>

            <blockquote className="mt-5 text-[19px] font-medium leading-snug tracking-[-0.015em] text-ink">
              “We keyed partitions by user_id with murmur3 so ordering held per user. When one consumer lagged, I split
              the hot partition instead of adding brokers.”
            </blockquote>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-bg px-3.5 py-2.5">
              <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-bg">
                <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3" fill="currentColor">
                  <path d="M2.5 1.5v9l8-4.5z" />
                </svg>
              </span>
              <span className="font-mono text-[12.5px] text-ink-2">Clip 08:42–08:57</span>
              <MiniWave bars={22} animate={false} className="ml-auto text-line-strong" />
            </div>

            <div className="mt-5">
              <p className="text-[13px] font-semibold text-ink">Rationale</p>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">
                Names the key, the hash, and the trade-off, and describes a decision they made under load. That fits Owned
                better than Contributed.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-4 border-t border-line pt-5">
              <RingWithLabel label="Before" sub="Owned ≈ Contributed" belief={BEFORE} provisional />
              <svg viewBox="0 0 24 12" className="h-3 w-8 shrink-0 text-line-strong" fill="none" aria-hidden>
                <path d="M1 6h20m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <RingWithLabel label="After" sub="Leaning Owned" belief={SETTLED} />
            </div>
          </article>
        </Reveal>
      </Container>
    </section>
  );
}

function RingWithLabel({
  label,
  sub,
  belief,
  provisional,
}: {
  label: string;
  sub: string;
  belief: { owned: number; contributed: number; surface: number };
  provisional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <BeliefRing belief={belief} size={40} provisional={provisional} />
      <div>
        <p className="eyebrow">{label}</p>
        <p className="text-[13px] font-medium text-ink-2">{sub}</p>
      </div>
    </div>
  );
}
