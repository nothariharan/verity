import Link from "next/link";
import { Button } from "@/components/ui/primitives";

const LINKS = [
  { href: "#live", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#teams", label: "For Recruiters" },
  { href: "#candidates", label: "For Candidates" },
  { href: "#trust", label: "Trust" },
];

const focus = "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-bg/80 backdrop-blur-md">
      <nav aria-label="Primary" className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Verity home" className={`inline-flex items-center gap-2 ${focus}`}>
          <span aria-hidden className="h-2 w-2 rounded-full bg-muted" />
          <span className="text-[22px] font-semibold tracking-[-0.04em] text-ink">Verity</span>
        </Link>
        <ul className="hidden items-center gap-8 text-[14px] text-ink-2 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={`transition-colors hover:text-ink ${focus}`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-5">
          <Link href="/app" className={`hidden text-[14px] text-ink-2 transition-colors hover:text-ink sm:inline ${focus}`}>
            Sign in
          </Link>
          <Button href="/app/new" size="md" arrow>
            Start an interview
          </Button>
        </div>
      </nav>
      <ul
        aria-label="Sections"
        className="flex gap-5 overflow-x-auto whitespace-nowrap border-t border-line/60 px-5 py-2.5 text-[13px] text-ink-2 lg:hidden"
      >
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={focus}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  );
}
