import Link from "next/link";
import { cn } from "@/lib/utils";

type BtnProps = {
  href?: string;
  variant?: "solid" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  arrow?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({ href, variant = "solid", size = "md", className, children, arrow, ...rest }: BtnProps) {
  const cls = cn(
    "group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50",
    size === "sm" && "h-8 px-3.5 text-[13px]",
    size === "md" && "h-10 px-5 text-sm",
    size === "lg" && "h-12 px-6 text-[15px]",
    variant === "solid" && "bg-ink text-bg hover:bg-ink-2",
    variant === "ghost" && "border border-line-strong bg-card/60 text-ink hover:bg-card",
    className,
  );
  const inner = (
    <>
      {children}
      {arrow && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none">
          <path d="M3 8h9m-3.5-4L12 8l-3.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {inner}
    </button>
  );
}

export function Pill({
  color = "var(--ink)",
  children,
  className,
  pulse,
}: {
  color?: string;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border border-line bg-card px-2.5 text-[12px] font-medium text-ink-2",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", pulse && "anim-blink")} style={{ background: color }} />
      {children}
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.03em]", className)}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="var(--line-strong)" strokeWidth="3" />
        <path d="M12 3a9 9 0 0 1 8.2 5.3" stroke="var(--owned)" strokeWidth="3" />
        <path d="M20.2 8.3A9 9 0 0 1 16 19.8" stroke="var(--contributed)" strokeWidth="3" />
        <circle cx="12" cy="12" r="2.2" fill="var(--ink)" />
      </svg>
      Verity
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full border border-dashed border-line-strong px-2 font-mono text-[10px] uppercase tracking-wider text-muted",
        className,
      )}
      title="This view is rendered from a scripted demo event log"
    >
      Demo data
    </span>
  );
}
