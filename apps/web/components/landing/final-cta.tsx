import Link from "next/link";
import { Button, Logo } from "@/components/ui/primitives";
import { LensTile } from "./icon-tiles";
import { Container } from "./section";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="border-t border-line py-32 sm:py-44">
      <Container>
        <Reveal className="mx-auto max-w-4xl text-center">
          <h2 id="cta-title" className="display text-balance text-[clamp(44px,7vw,92px)]">
            Stop interviewing resumes.{" "}
            <span className="text-muted">
              Start <LensTile /> investigating candidates.
            </span>
          </h2>
          <div className="mt-11 flex flex-wrap items-center justify-center gap-3">
            <Button href="/app/new" size="lg" arrow>
              Start an interview
            </Button>
            <Button href="/me" variant="ghost" size="lg">
              Practice as a candidate
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

const FOOTER_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#teams", label: "For teams" },
  { href: "#candidates", label: "For candidates" },
  { href: "/app", label: "Dashboard" },
  { href: "/me", label: "Practice" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-line py-10">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Logo />
          <p className="text-[13px] text-muted">Resumes make claims. Verity checks them, out loud.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-ink-2">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="rounded-sm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
