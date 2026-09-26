"use client";

import FluidOrb from "./fluid-orb";
import { cn } from "@/lib/utils";

export type OrbMode = "idle" | "listening" | "candidate" | "verity" | "yield";

const COLOR: Record<OrbMode, string> = {
  idle: "#2B4C7E",
  listening: "#2B4C7E",
  candidate: "#2B4C7E",
  verity: "#1A73F2",
  yield: "#77736D",
};

export interface VoiceOrbProps {
  mode: OrbMode;
  /** 0..1 audio level (mic when the candidate speaks, TTS when Verity speaks). */
  level?: number;
  size?: number;
  className?: string;
}

/**
 * Wraps the provided FluidOrb (shader unmodified). State drives color and a CSS
 * scale/halo; level drives amplitude.
 */
export function VoiceOrb({ mode, level = 0, size = 240, className }: VoiceOrbProps) {
  const l = Math.max(0, Math.min(1, level));
  const scale = mode === "verity" ? 1 + l * 0.08 : mode === "yield" ? 0.94 : 1;
  const halo = mode === "candidate" ? 0.25 + l * 0.75 : 0;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size * 1.35, height: size * 1.35 }}
      data-mode={mode}
    >
      <div
        className={cn("absolute rounded-full transition-all duration-200", mode === "listening" && "anim-drift")}
        style={{
          width: size * 1.08,
          height: size * 1.08,
          boxShadow: `0 0 0 ${2 + halo * 14}px rgba(43, 76, 126, ${0.06 + halo * 0.1})`,
          opacity: halo > 0 ? 1 : 0,
        }}
      />
      <div
        className="rounded-full transition-[transform,filter,opacity] duration-150 ease-out"
        style={{
          transform: `scale(${scale})`,
          opacity: mode === "yield" ? 0.7 : 1,
          filter: `drop-shadow(0 24px 40px rgba(26, 60, 120, ${0.18 + l * 0.12}))`,
        }}
      >
        <FluidOrb size={size} color={COLOR[mode]} />
      </div>
    </div>
  );
}
