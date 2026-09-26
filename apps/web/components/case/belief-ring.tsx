import type { Belief, CaseStatus } from "@verity/contracts";
import { cn } from "@/lib/utils";
import { HYP_COLOR } from "@/lib/hypotheses";

export interface BeliefRingProps {
  belief: Belief;
  size?: number;
  stroke?: number;
  provisional?: boolean;
  status?: CaseStatus;
  conflict?: boolean;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const ORDER = ["owned", "contributed", "surface"] as const;
const GAP = 0.012;

/**
 * Three arcs proportional to owned / contributed / surface. Arcs tween on change;
 * provisional beliefs get a moving dashed overlay; settled cases draw solid.
 */
export function BeliefRing({
  belief,
  size = 64,
  stroke,
  provisional = false,
  status,
  conflict = false,
  active = false,
  className,
  children,
}: BeliefRingProps) {
  const sw = stroke ?? Math.max(3, Math.round(size * 0.085));
  const r = (size - sw) / 2 - (active ? 3 : 0);
  const c = 2 * Math.PI * r;
  const untouched = status === "UNTOUCHED";
  let start = 0;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Owned ${pct(belief.owned)}, Contributed ${pct(belief.contributed)}, Surface ${pct(belief.surface)}${
        provisional ? " (provisional)" : ""
      }`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        {active && (
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="none" stroke="var(--ink)" strokeWidth={1} opacity={0.85} />
        )}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-sunk)" strokeWidth={sw} />
        {!untouched &&
          ORDER.map((h) => {
            const frac = Math.max(0, belief[h] - GAP);
            const len = frac * c;
            const offset = -start * c;
            start += belief[h];
            return (
              <circle
                key={h}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={HYP_COLOR[h]}
                strokeWidth={sw}
                strokeLinecap="butt"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dasharray 600ms cubic-bezier(.2,.8,.2,1), stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)" }}
                opacity={provisional ? 0.8 : 1}
              />
            );
          })}
        {untouched && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={1} strokeDasharray="3 4" />
        )}
        {provisional && !untouched && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--card)"
            strokeWidth={sw + 1}
            strokeDasharray="3 9"
            className="anim-shimmer"
            opacity={0.9}
          />
        )}
      </svg>
      {conflict && (
        <span
          className="absolute -top-0.5 right-0 h-2.5 w-2.5 rounded-full border-2 border-card"
          style={{ background: "var(--conflict)" }}
          aria-label="conflict flagged"
        />
      )}
      <div className="relative flex items-center justify-center text-center">{children}</div>
    </div>
  );
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}
