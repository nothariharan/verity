import { cn } from "@/lib/utils";

export const HERO_QUESTION = "When a consumer fell behind at peak, what did you change first, and why?";
export const SETTLED = { owned: 0.74, contributed: 0.2, surface: 0.06 };

/** Explicit pixel heights. Percentage heights collapse inside flex cards and render as noise. */
export function MiniWave({ bars = 14, className, animate = true }: { bars?: number; className?: string; animate?: boolean }) {
  const h = 16;
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-[2px]", className)} style={{ height: h }}>
      {Array.from({ length: bars }, (_, i) => {
        const shape = Math.sin(((i + 0.5) / bars) * Math.PI);
        const px = Math.max(3, Math.round(3 + shape * (h - 4) * (0.45 + ((i * 3) % 5) / 8)));
        return (
          <span
            key={i}
            className={cn("w-[2px] rounded-full bg-current", animate && "anim-bar")}
            style={{ height: px, animationDelay: `${(i % 7) * 0.11}s` }}
          />
        );
      })}
    </span>
  );
}
