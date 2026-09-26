"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { Icon } from "./icons";

type NavItem = { href: string; label: string; icon: keyof typeof Icon; match?: string };

const NAV: Record<"team" | "candidate", NavItem[]> = {
  team: [
    { href: "/app", label: "Interviews", icon: "list" },
    { href: "/app/new", label: "New interview", icon: "plus" },
    { href: "/app/live/demo", label: "Live board", icon: "live", match: "/app/live" },
    { href: "/app/dossier/demo", label: "Dossiers", icon: "doc", match: "/app/dossier" },
  ],
  candidate: [
    { href: "/me", label: "Practice", icon: "growth" },
    { href: "/me/new", label: "Start practice", icon: "mic" },
    { href: "/me/report/demo", label: "Reports", icon: "doc", match: "/me/report" },
  ],
};

export function AppShell({ role, children }: { role: "team" | "candidate"; children: React.ReactNode }) {
  const path = usePathname();
  const items = NAV[role];

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-line bg-bg px-3 py-4 md:flex">
        <Link href="/" className="px-2 pb-6 pt-1">
          <Logo />
        </Link>
        <p className="eyebrow px-2 pb-2">{role === "team" ? "Hiring team" : "Candidate"}</p>
        <nav className="flex flex-col gap-0.5">
          {items.map((it) => {
            const active = it.match ? path.startsWith(it.match) : path === it.href;
            const I = Icon[it.icon];
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] text-ink-2 transition-colors hover:bg-card",
                  active && "bg-card font-medium text-ink shadow-[var(--shadow-card)] ring-1 ring-line",
                )}
              >
                <span className={cn("text-muted", active && "text-ink")}>
                  <I />
                </span>
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3 px-2">
          <RoleSwitch role={role} />
          <p className="text-[11px] leading-relaxed text-muted">
            Demo mode: no sign-in. Views marked <span className="font-mono">DEMO DATA</span> are rendered from a scripted event log.
          </p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-line px-4 md:hidden">
          <Link href="/"><Logo /></Link>
          <RoleSwitch role={role} />
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function RoleSwitch({ role }: { role: "team" | "candidate" }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-bg-sunk p-0.5 text-[12px]" role="tablist" aria-label="Switch view">
      {(
        [
          ["team", "Hiring team", "/app"],
          ["candidate", "Candidate", "/me"],
        ] as const
      ).map(([r, label, href]) => (
        <Link
          key={r}
          href={href}
          role="tab"
          aria-selected={role === r}
          className={cn("rounded-full px-3 py-1 text-muted transition", role === r && "bg-card text-ink shadow-[var(--shadow-card)]")}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function PageHeader({ eyebrow, title, right, children }: { eyebrow?: React.ReactNode; title: React.ReactNode; right?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-5 pt-8 md:px-10">
      <div>
        {eyebrow && <div className="eyebrow mb-2 flex items-center gap-2">{eyebrow}</div>}
        <h1 className="headline text-[30px] md:text-[34px]">{title}</h1>
        {children && <p className="mt-2 max-w-2xl text-[15px] text-muted">{children}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
