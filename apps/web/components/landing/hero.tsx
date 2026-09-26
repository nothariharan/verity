import { Button } from "@/components/ui/primitives";
import { AmberDot } from "./icon-tiles";
import { HeroStage } from "./hero-stage";
import { Container } from "./section";

const PAPER_NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.4 0 0 0 0 0.33 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function Hero() {
  return (
    <section id="product" aria-labelledby="hero-title" className="relative scroll-mt-16 overflow-x-clip pb-20 pt-14 sm:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(42% 32% at 14% 22%, rgba(255,255,255,0.75), transparent 70%)",
            "radial-gradient(38% 30% at 86% 18%, rgba(255,255,255,0.6), transparent 70%)",
            "radial-gradient(55% 40% at 22% 78%, rgba(226,218,205,0.45), transparent 72%)",
            "radial-gradient(50% 38% at 84% 72%, rgba(232,225,213,0.5), transparent 72%)",
          ].join(","),
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply" style={{ backgroundImage: PAPER_NOISE }} />

      <Container className="relative max-w-[1440px] text-center">
        <HeroStage>
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.32em] text-muted">AI Interview Intelligence</p>
          <h1 id="hero-title" className="display mx-auto text-[clamp(48px,6.2vw,92px)] text-ink">
            Interviews that
            <br />
            investigate
            <AmberDot />
          </h1>
          <p className="mx-auto mt-6 max-w-[34rem] text-pretty text-[17px] leading-relaxed text-muted md:text-[18px]">
            Verity turns a candidate&apos;s resume into a live investigation — asking adaptive questions, following the
            evidence, and showing exactly what the interview established.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/app/new" size="lg" arrow>
              Start with Verity
            </Button>
            <Button href="#how" variant="ghost" size="lg" className="bg-card">
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden>
                <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8.3 6.8v6.4l5-3.2z" fill="currentColor" />
              </svg>
              See how it works
            </Button>
          </div>
        </HeroStage>
      </Container>
    </section>
  );
}
