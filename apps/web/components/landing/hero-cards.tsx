import { cn } from "@/lib/utils";
import { MiniWave } from "./artifacts";

export const HERO_Q = "You mentioned the system served 100,000 documents. How did you handle retrieval latency at that scale?";
export const HERO_A =
  "We used FAISS with HNSW indexing and cached the most frequent queries to reduce latency. Managed vector databases were too expensive at our expected query volume.";
export const CHECKS = [
  "Explained retrieval architecture",
  "Discussed HNSW indexing",
  "Covered latency optimization",
  "Provided tradeoff reasoning",
];

function Card({ className, label, children }: { className?: string; label: string; children: React.ReactNode }) {
  return (
    <figure
      aria-label={label}
      className={cn("rounded-[18px] border border-line bg-card/95 p-4 text-left shadow-float backdrop-blur-sm", className)}
    >
      {children}
    </figure>
  );
}

export function VerityMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full border border-line bg-card", className)}>
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
        <path d="M3 4l5 9 5-9" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function StepPill({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-full border border-line bg-card px-3 text-[12px] font-medium text-ink-2 shadow-card">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />
      {n}. {label}
    </span>
  );
}

export function ResumeCard({ className }: { className?: string }) {
  return (
    <Card label="Resume claims" className={className}>
      <div className="mb-3 flex items-center gap-2">
        <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#D6453D] text-[6.5px] font-bold text-white">
          PDF
        </span>
        <span className="text-[13px] font-medium text-ink">Resume.pdf</span>
        <span aria-hidden className="ml-auto flex h-6 w-6 items-center justify-center rounded-md border border-line text-muted">
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
            <path d="M4 2h5l3 3v9H4z M9 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <ul className="space-y-2.5 text-[12.5px] leading-snug text-ink-2">
        <li className="relative">
          <span
            aria-hidden
            className="anim-sweep absolute -inset-x-1 -inset-y-0.5 rounded-[4px]"
            style={{ background: "color-mix(in srgb, var(--surface) 24%, transparent)" }}
          />
          <span className="relative font-medium text-ink">Built a RAG system serving 100k documents</span>
        </li>
        <li className="pl-2">Reduced inference latency by 40% using quantization</li>
        <li className="pl-2">Deployed on AWS with Kubernetes</li>
      </ul>
    </Card>
  );
}

export function InterviewerCard({ className }: { className?: string }) {
  return (
    <Card label="Verity asks an adaptive question" className={className}>
      <div className="mb-3 flex items-center gap-2">
        <VerityMark />
        <span className="text-[12.5px] font-medium text-ink">Verity (AI Interviewer)</span>
      </div>
      <div className="mb-3 flex items-center gap-3 text-ink">
        <MiniWave bars={18} />
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted">
          <span aria-hidden className="anim-blink h-1.5 w-1.5 rounded-full bg-ink" />
          Listening...
        </span>
      </div>
      <p className="rounded-xl bg-bg-sunk px-3 py-2.5 text-[12.5px] leading-snug text-ink-2">{HERO_Q}</p>
    </Card>
  );
}

export function EvidenceCard({ className }: { className?: string }) {
  return (
    <Card label="Evidence clip" className={className}>
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold tracking-[-0.01em] text-ink">Evidence</span>
        <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-muted">
          <MiniWave bars={4} animate={false} className="h-2.5" />
        </span>
      </div>
      <p className="mt-1 font-mono text-[12px] text-muted">08:42 — 08:57</p>
      <div className="mt-3 flex items-center gap-2.5">
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-bg">
          <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3" fill="currentColor">
            <path d="M2.5 1.5v9l8-4.5z" />
          </svg>
        </span>
        <MiniWave bars={20} animate={false} className="h-6 text-ink-2" />
      </div>
      <blockquote className="mt-3 text-[12.5px] italic leading-snug text-ink-2">
        “We used FAISS with HNSW indexing and cached the most frequent queries...”
      </blockquote>
    </Card>
  );
}

export function ResolvedCard({ className, checked = CHECKS.length, badge = true }: { className?: string; checked?: number; badge?: boolean }) {
  return (
    <Card label="Claim resolved as Owned" className={className}>
      <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-owned" />
        Claim Resolved
      </p>
      <p className="mt-2 text-[15px] font-semibold tracking-[-0.02em] text-ink">RAG system — 100k documents</p>
      <span
        className={cn(
          "mt-2 inline-flex h-6 items-center rounded-md px-2 font-mono text-[11px] font-semibold tracking-wider text-white transition-all duration-300",
          badge ? "scale-100 opacity-100" : "scale-90 opacity-0",
        )}
        style={{ background: "var(--owned)" }}
      >
        OWNED
      </span>
      <ul className="mt-3 space-y-1.5">
        {CHECKS.map((c, i) => {
          const on = i < checked;
          return (
            <li key={c} className={cn("flex items-center gap-2 text-[12.5px] transition-colors duration-300", on ? "text-ink-2" : "text-muted/60")}>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
                <circle cx="8" cy="8" r="7" fill={on ? "var(--owned)" : "var(--line)"} className="transition-colors duration-300" />
                <path
                  d="m5 8 2 2 4-4"
                  stroke="#fff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={on ? 1 : 0}
                />
              </svg>
              {c}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
