"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(cb: () => void) {
  const mql = window.matchMedia(REDUCED_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/** True while the element intersects the viewport. Used to pause scripted loops offscreen. */
export function useInView(ref: RefObject<Element | null>, rootMargin = "0px"): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/** Monotonic clock (ms) that loops at `loopMs`, ticking only while `running`. */
export function useLoopClock(running: boolean, loopMs: number, stepMs = 100, startAt = 0): number {
  const [t, setT] = useState(startAt);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setT((v) => (v + stepMs) % loopMs), stepMs);
    return () => window.clearInterval(id);
  }, [running, loopMs, stepMs]);
  return t;
}
