"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CHECKS, EvidenceCard, InterviewerCard, ResolvedCard, ResumeCard, StepPill } from "./hero-cards";
import { ANSWER_WORD_COUNT, HeroWindow } from "./hero-window";
import { useInView, useLoopClock, useReducedMotion } from "./hooks";

const LOOP_MS = 10_000;
const ANSWER_AT = 500;
const WORD_MS = 85;
const ANSWER_END = ANSWER_AT + ANSWER_WORD_COUNT * WORD_MS;
const CHECK_AT = ANSWER_END + 400;
const CHECK_MS = 450;
const BADGE_AT = CHECK_AT + CHECKS.length * CHECK_MS;
/** The loop opens on its resting frame, so first paint matches the static design. */
const REST_AT = 6500;

const AMBER = "var(--surface)";
const GREEN = "var(--owned)";

export function HeroStage({ children }: { children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [paths, setPaths] = useState<string[]>([]);

  const reduced = useReducedMotion();
  const inView = useInView(windowRef);
  const clock = useLoopClock(inView && !reduced, LOOP_MS, 100, REST_AT);
  const t = reduced ? REST_AT : clock;

  const words = t < ANSWER_AT ? 0 : Math.min(ANSWER_WORD_COUNT, Math.floor((t - ANSWER_AT) / WORD_MS) + 1);
  const speaking = t >= ANSWER_AT && t < ANSWER_END;
  const checked = t < CHECK_AT ? 0 : Math.min(CHECKS.length, Math.floor((t - CHECK_AT) / CHECK_MS) + 1);
  const badge = t >= BADGE_AT;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const s = stage.getBoundingClientRect();
        const win = windowRef.current?.getBoundingClientRect();
        const c = cardRefs.current.map((el) => el?.getBoundingClientRect());
        const p = pillRefs.current.map((el) => el?.getBoundingClientRect());
        if (!win || !c[0] || c[0].width === 0 || !c[1] || !c[2] || !c[3] || !p[0] || !p[1]) {
          setPaths([]);
          return;
        }
        const X = (v: number) => Math.round(v - s.left);
        const Y = (v: number) => Math.round(v - s.top);
        const curve = (ax: number, ay: number, c1x: number, c1y: number, c2x: number, c2y: number, bx: number, by: number) =>
          `M ${ax} ${ay} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${bx} ${by}`;

        const a1 = { x: X(c[0].right), y: Y(c[0].top + c[0].height * 0.55) };
        const b1 = { x: X(win.left + win.width * 0.12), y: Y(win.top) };
        const a2 = { x: X(c[1].left), y: Y(c[1].top + c[1].height * 0.62) };
        const b2 = { x: X(win.right - win.width * 0.12), y: Y(win.top) };
        const a3 = { x: X(p[0].left + p[0].width * 0.3), y: Y(p[0].bottom) };
        const b3 = { x: X(c[2].left + c[2].width * 0.3), y: Y(c[2].top) };
        const a4 = { x: X(p[1].left + p[1].width * 0.7), y: Y(p[1].bottom) };
        const b4 = { x: X(c[3].left + c[3].width * 0.7), y: Y(c[3].top) };

        setPaths([
          curve(a1.x, a1.y, a1.x + 90, a1.y, b1.x, b1.y - 110, b1.x, b1.y),
          curve(a2.x, a2.y, a2.x - 90, a2.y, b2.x, b2.y - 110, b2.x, b2.y),
          curve(a3.x, a3.y, a3.x - 70, a3.y + 90, b3.x - 70, b3.y - 90, b3.x, b3.y),
          curve(a4.x, a4.y, a4.x + 70, a4.y + 90, b4.x + 70, b4.y - 90, b4.x, b4.y),
        ]);
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    document.fonts?.ready.then(measure);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const floats = [
    {
      node: <ResumeCard />,
      pill: <StepPill n={1} label="Extract claims" color={AMBER} />,
      pos: "left-[2%] top-[-8px] w-[236px] min-[1400px]:w-[252px]",
      rot: 3,
      pillCls: "ml-12",
      delay: "0s",
    },
    {
      node: <InterviewerCard />,
      pill: <StepPill n={2} label="Ask adaptive questions" color={AMBER} />,
      pos: "right-[2%] top-[-18px] w-[236px] min-[1400px]:w-[252px]",
      rot: 4,
      pillCls: "ml-5",
      delay: "1.2s",
    },
  ];
  const sideFloats = [
    {
      node: <EvidenceCard />,
      pill: <StepPill n={3} label="Gather evidence" color={GREEN} />,
      pos: "right-[calc(100%+14px)] top-[30%] w-[212px] min-[1400px]:w-[238px]",
      rot: -4,
      pillCls: "ml-10",
      delay: "0.6s",
    },
    {
      node: <ResolvedCard checked={checked} badge={badge} />,
      pill: <StepPill n={4} label="Reach a conclusion" color={GREEN} />,
      pos: "left-[calc(100%+14px)] top-[20%] w-[216px] min-[1400px]:w-[248px]",
      rot: 3,
      pillCls: "ml-6",
      delay: "1.8s",
    },
  ];

  const renderFloat = (f: (typeof floats)[number], i: number) => (
    <div key={i} className={cn("absolute z-20 hidden xl:block", f.pos)} style={{ transform: `rotate(${f.rot}deg)` }}>
      <div className="anim-drift" style={{ animationDelay: f.delay }}>
        <div ref={(el) => void (cardRefs.current[i] = el)}>{f.node}</div>
        <div ref={(el) => void (pillRefs.current[i] = el)} className={cn("mt-3 w-fit", f.pillCls)}>
          {f.pill}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={stageRef} className="relative">
      <svg aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full overflow-visible xl:block">
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--line-strong)" strokeWidth="1.2" strokeDasharray="3 5" strokeLinecap="round" />
        ))}
      </svg>

      <div className="relative z-10">{children}</div>

      {floats.map((f, i) => renderFloat(f, i))}

      <div className="relative z-10 mx-auto mt-14 max-w-[960px] xl:max-w-[760px] min-[1400px]:max-w-[800px]">
        <div ref={windowRef}>
          <HeroWindow words={words} speaking={speaking} />
        </div>
        {sideFloats.map((f, i) => renderFloat(f, i + 2))}
      </div>

      {/* below xl: cards stack under the window */}
      <ol className="mx-auto mt-10 grid max-w-[960px] gap-x-5 gap-y-8 sm:grid-cols-2 xl:hidden" aria-label="How one claim resolves">
        {[...floats, ...sideFloats].map((f, i) => (
          <li key={i} className="flex flex-col">
            <div className="flex-1 [&>figure]:h-full">{i === 3 ? <ResolvedCard /> : f.node}</div>
            <div className="mt-3">{f.pill}</div>
          </li>
        ))}
      </ol>

      <a
        href="#how"
        className="mx-auto mt-12 flex w-fit flex-col items-center gap-1.5 rounded-md text-[12px] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4 anim-drift" fill="none" aria-hidden>
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Scroll to explore
      </a>
    </div>
  );
}
