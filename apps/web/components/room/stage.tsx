"use client";

import type { SessionState } from "@verity/contracts";
import FluidOrb from "@/components/voice/fluid-orb";
import { cn } from "@/lib/utils";

export interface StageControls {
  muted?: boolean;
  onMute?: () => void;
  onEnd?: () => void;
  onType?: () => void;
  typing?: boolean;
  cameraOn?: boolean;
  onCamera?: () => void;
}

const ORB_COLOR = { verity: "#F08A4B", candidate: "#E9965F", listening: "#F2A56E", idle: "#F2B084" };

export function orbMode(s: SessionState): keyof typeof ORB_COLOR {
  if (!s.started || s.ended) return "idle";
  if (s.partial) return "candidate";
  if (s.speakingQuestionId) return "verity";
  return "listening";
}

const STATUS = { verity: "Speaking", candidate: "Hearing you", listening: "Listening", idle: "Ready" };

/** Question up top, the FluidOrb in the middle with a level-driven waveform, controls below. */
export function Stage({ s, level = 0, controls }: { s: SessionState; level?: number; controls?: StageControls }) {
  const mode = orbMode(s);
  const q = visibleQuestion(s);
  const [lead, rest] = splitQuestion(q?.text ?? "");
  const l = Math.max(0, Math.min(1, level));
  const size = 232;

  return (
    <section className="relative flex min-h-[560px] flex-col items-center overflow-hidden rounded-[20px] px-4 pb-6 pt-6">
      <Waves />
      <div className="relative flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-bg">V</span>
        Verity
      </div>
      <p className="relative mt-2 flex items-center gap-2 text-[13px] text-muted" aria-live="polite">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: mode === "idle" ? "var(--open)" : "var(--surface)" }} />
        {s.ended ? "Interview complete" : STATUS[mode]}
        {!s.ended && mode !== "idle" && <span className="anim-blink text-[#F08A4B]">…</span>}
      </p>

      <h2 className="relative mt-6 max-w-[560px] text-balance text-center text-[24px] font-medium leading-[1.22] tracking-[-0.025em] md:text-[28px]" aria-live="polite">
        {q ? (
          <>
            <span className="text-ink">{lead}</span>
            {rest && <span className="text-muted"> {rest}</span>}
          </>
        ) : (
          <span className="text-muted">{s.started ? "Preparing the first question…" : "Your interview will start in a moment."}</span>
        )}
      </h2>

      <div className="relative my-auto flex items-center justify-center py-8">
        <div
          className="absolute rounded-full transition-all duration-200"
          style={{
            width: size * 1.5,
            height: size * 1.5,
            background: `radial-gradient(circle, rgba(240,138,75,${0.16 + l * 0.14}) 0%, rgba(240,138,75,0) 65%)`,
          }}
        />
        <div
          className="relative rounded-full transition-transform duration-150 ease-out"
          style={{
            transform: `scale(${mode === "verity" ? 1 + l * 0.06 : mode === "candidate" ? 1 + l * 0.03 : 1})`,
            boxShadow: "0 30px 60px -20px rgba(240,138,75,.45), inset 0 0 0 1px rgba(255,255,255,.6)",
            borderRadius: "9999px",
          }}
        >
          <FluidOrb size={size} color={ORB_COLOR[mode]} />
          <Bars level={l} active={mode === "verity" || mode === "candidate"} />
        </div>
      </div>

      <div className="relative flex items-start gap-10">
        <Control label={controls?.cameraOn ? "Camera on" : "Camera"} onClick={controls?.onCamera} disabled={!controls?.onCamera}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M2.2 4.2h7.2v7.6H2.2z" />
            <path d="M9.4 7.1l4.4-2.1v6l-4.4-2.1z" />
          </svg>
        </Control>
        <Control label={controls?.muted ? "Unmute" : "Mute"} onClick={controls?.onMute} disabled={!controls?.onMute}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <rect x="5.8" y="1.8" width="4.4" height="8" rx="2.2" />
            <path d="M3.5 7.8a4.5 4.5 0 0 0 9 0M8 12.3v2" />
            {controls?.muted && <path d="M2.5 2.5l11 11" />}
          </svg>
        </Control>
        <Control label="End" onClick={controls?.onEnd} disabled={!controls?.onEnd} primary>
          <span className="h-3.5 w-3.5 rounded-[3px] bg-white" />
        </Control>
        <Control label={controls?.typing ? "Speak instead" : "Type instead"} onClick={controls?.onType} disabled={!controls?.onType}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />
          </svg>
        </Control>
      </div>
      <p className="relative mt-3 text-[11.5px] text-muted">You can interrupt anytime.</p>
    </section>
  );
}

/** The line being spoken, or the next one that has not started, so the greeting is not replaced by the question early. */
function visibleQuestion(s: SessionState) {
  if (s.speakingQuestionId) return s.questions[s.speakingQuestionId] ?? null;
  const pending = s.questionOrder.find((id) => s.questions[id]?.spokenStartMs == null);
  const id = pending ?? s.questionOrder.at(-1);
  return id ? s.questions[id] ?? null : null;
}

function splitQuestion(text: string): [string, string] {
  const i = text.indexOf(", ");
  if (i > 12 && i < text.length - 12) return [text.slice(0, i + 1), text.slice(i + 2)];
  return [text, ""];
}

function Control({ label, children, onClick, disabled, primary }: { label: string; children: React.ReactNode; onClick?: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="group flex w-16 flex-col items-center gap-2 disabled:cursor-default">
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition",
          primary
            ? "bg-[#E5533D] text-white shadow-[0_10px_24px_-8px_rgba(229,83,61,.7)] group-enabled:group-hover:scale-105"
            : "bg-card text-ink-2 shadow-[var(--shadow-card)] ring-1 ring-line group-enabled:group-hover:ring-ink/30",
          disabled && "opacity-60",
        )}
      >
        {children}
      </span>
      <span className="text-[11.5px] text-ink-2">{label}</span>
    </button>
  );
}

function Bars({ level, active }: { level: number; active: boolean }) {
  const n = 11;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[3px]" aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const shape = Math.sin((i / (n - 1)) * Math.PI);
        const h = active ? 6 + shape * (10 + level * 38) : 4 + shape * 6;
        return (
          <span
            key={i}
            className={cn("w-[3px] rounded-full bg-[#D9692E]/70 transition-[height] duration-100", active && "anim-bar")}
            style={{ height: h, animationDelay: `${i * 70}ms`, animationDuration: `${0.9 + (i % 3) * 0.15}s` }}
          />
        );
      })}
    </div>
  );
}

function Waves() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-[48%] h-[220px] w-full" viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden>
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${110 + i * 6} C 180 ${40 + i * 14}, 300 ${190 - i * 10}, 400 ${110 + i * 3} S 640 ${30 + i * 16}, 800 ${100 + i * 8}`}
          fill="none"
          stroke="#E9A77A"
          strokeOpacity={0.1 + (i % 3) * 0.05}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}
