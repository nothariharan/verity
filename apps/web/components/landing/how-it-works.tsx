"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Belief, CaseStatus } from "@verity/contracts";
import { BeliefRing } from "@/components/case/belief-ring";
import { HYP_COLOR, HYP_LABEL } from "@/lib/hypotheses";
import { cn } from "@/lib/utils";
import { HERO_QUESTION, SETTLED } from "./artifacts";
import { RingTile } from "./icon-tiles";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STEPS = [
  { title: "One line of the resume", body: "Verity reads the resume and picks out the claims worth checking." },
  { title: "becomes a case", body: "Each claim holds three competing explanations: Owned, Contributed, and Surface." },
  { title: "that gets a question", body: "The question is chosen to separate the two explanations that are currently tied." },
  { title: "and leaves a receipt.", body: "The answer moves the ring. The quote, clip, and reasoning are kept with it." },
];

const RINGS: { belief: Belief; status: CaseStatus; provisional: boolean }[] = [
  { belief: { owned: 0.34, contributed: 0.33, surface: 0.33 }, status: "UNTOUCHED", provisional: false },
  { belief: { owned: 0.25, contributed: 0.45, surface: 0.3 }, status: "INVESTIGATING", provisional: false },
  { belief: { owned: 0.52, contributed: 0.34, surface: 0.14 }, status: "INVESTIGATING", provisional: true },
  { belief: SETTLED, status: "SETTLED_OWNED", provisional: false },
];

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [step, setStep] = useState(3);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        setPinned(true);
        setStep(0);
        const st = ScrollTrigger.create({
          trigger: pinRef.current,
          start: "top top",
          end: "+=2400",
          pin: true,
          onUpdate: (self) => setStep(Math.min(3, Math.floor(self.progress * 4))),
        });
        return () => {
          st.kill();
          setPinned(false);
          setStep(3);
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const ring = RINGS[step]!;

  return (
    <section id="how" ref={ref} aria-labelledby="how-title" className="scroll-mt-28 border-t md:scroll-mt-16 border-line bg-bg-sunk/50">
      <div ref={pinRef} className="flex items-center py-24 md:min-h-screen md:py-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 md:grid-cols-[1fr_minmax(0,460px)] md:gap-16">
          <div>
            <p className="eyebrow mb-5">How it works</p>
            <h2 id="how-title" className="headline text-balance text-[clamp(36px,5vw,64px)]">
              Four steps. One <RingTile /> moving belief.
            </h2>
            <ol className="mt-10 space-y-1">
              {STEPS.map((s, i) => {
                const on = !pinned || i === step;
                return (
                  <li
                    key={s.title}
                    aria-current={pinned && i === step ? "step" : undefined}
                    className={cn(
                      "flex gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-300",
                      on && pinned ? "border-line bg-card shadow-card" : "border-transparent",
                      !on && "opacity-45",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] transition-colors",
                        on ? "bg-ink text-bg" : "bg-line text-muted",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[17px] font-semibold tracking-[-0.02em] text-ink">{s.title}</p>
                      <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{s.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="card relative overflow-hidden p-6 sm:p-7" aria-live="polite">
            <p className="sr-only">
              Step {step + 1} of 4: {STEPS[step]!.title}
            </p>
            {/* resume line: always present, highlighted */}
            <div className="rounded-xl border border-line bg-bg px-4 py-3">
              <p className="text-[12px] text-muted">Senior Backend Engineer · 2022–2025</p>
              <p className="relative mt-1 text-[14px] font-medium text-ink">
                <span
                  aria-hidden
                  className="absolute -inset-x-1 inset-y-0 rounded-[4px]"
                  style={{ background: "color-mix(in srgb, var(--surface) 26%, transparent)" }}
                />
                <span className="relative">Built the event pipeline on Kafka at 50k events/s</span>
              </p>
            </div>

            {/* persistent ring */}
            <div className="flex flex-col items-center py-7">
              <div
                aria-hidden
                className={cn("mb-3 h-6 w-px transition-colors duration-500", step >= 1 ? "bg-line-strong" : "bg-transparent")}
              />
              <div className={cn("transition-all duration-500", step === 0 ? "scale-90 opacity-50" : "scale-100 opacity-100")}>
                <BeliefRing belief={ring.belief} status={ring.status} provisional={ring.provisional} size={120} active={step >= 1}>
                  <span className="text-[12px] font-medium" style={{ color: step === 3 ? "var(--owned)" : "var(--muted)" }}>
                    {step === 0 ? "claim" : step === 3 ? "Owned" : step === 2 ? "moving" : "case"}
                  </span>
                </BeliefRing>
              </div>
              <p className="mt-3 rounded-full border border-line bg-card px-3 py-1 text-[12px] font-medium">Kafka · 50k ev/s</p>
            </div>

            {/* step detail: crossfades */}
            <div className="relative h-[124px]">
              <Layer on={step === 0}>
                <p className="text-center text-[14px] leading-relaxed text-muted">
                  A claim with a scale, an ownership word, and a technology. Worth a case.
                </p>
              </Layer>
              <Layer on={step === 1}>
                <ul className="flex flex-wrap justify-center gap-2">
                  {(["owned", "contributed", "surface"] as const).map((h) => (
                    <li key={h} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[12px] font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ background: HYP_COLOR[h] }} />
                      {HYP_LABEL[h]}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-center text-[13px] text-muted">Leading: Contributed, with Owned close behind.</p>
              </Layer>
              <Layer on={step === 2}>
                <p className="rounded-xl rounded-tl-sm bg-ink px-3.5 py-2.5 text-[13.5px] leading-snug text-bg">{HERO_QUESTION}</p>
                <p className="mt-2.5 text-[12px] text-muted">Separates Owned from Contributed. The ring moves while they answer.</p>
              </Layer>
              <Layer on={step === 3}>
                <div className="rounded-xl border border-line bg-bg px-3.5 py-2.5">
                  <p className="text-[13px] leading-snug text-ink-2">“We keyed by user_id with murmur3 so ordering held per user.”</p>
                  <p className="mt-1.5 font-mono text-[11px] text-muted">Receipt · clip 08:42–08:57 · Contributed → Owned</p>
                </div>
              </Layer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Layer({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <div
      aria-hidden={!on}
      className={cn(
        "absolute inset-0 transition-all duration-500",
        on ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      {children}
    </div>
  );
}
