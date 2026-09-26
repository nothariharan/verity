import { cn } from "@/lib/utils";

type TileProps = { className?: string };

function Tile({ className, children }: TileProps & { children: React.ReactNode }) {
  return (
    <span className={cn("tile", className)} aria-hidden>
      {children}
    </span>
  );
}

/** Resume line with a highlight sweeping across it. */
export function ResumeTile({ className }: TileProps) {
  return (
    <Tile className={className}>
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="3" rx="1.5" fill="var(--line-strong)" />
        <rect x="3" y="10.5" width="18" height="3.4" rx="1.7" fill="var(--surface)" opacity="0.35" className="anim-sweep" />
        <rect x="3" y="11" width="13" height="2.4" rx="1.2" fill="var(--ink)" />
        <rect x="3" y="17" width="11" height="3" rx="1.5" fill="var(--line-strong)" />
      </svg>
    </Tile>
  );
}

/** Waveform bars pulsing. */
export function WaveTile({ className }: TileProps) {
  const bars = [
    { x: 3, h: 8 },
    { x: 7.5, h: 14 },
    { x: 12, h: 18 },
    { x: 16.5, h: 12 },
    { x: 21, h: 7 },
  ];
  return (
    <Tile className={className}>
      <svg viewBox="0 0 24 24" fill="none">
        {bars.map((b, i) => (
          <rect
            key={b.x}
            x={b.x - 1.25}
            y={12 - b.h / 2}
            width="2.5"
            height={b.h}
            rx="1.25"
            fill="var(--ink)"
            className="anim-bar"
            style={{ animationDelay: `${i * 0.13}s`, transformBox: "fill-box" }}
          />
        ))}
      </svg>
    </Tile>
  );
}

/** Belief ring filling toward Owned. */
export function RingTile({ className }: TileProps) {
  return (
    <Tile className={className}>
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="var(--bg-sunk)" strokeWidth="3.4" />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="var(--owned)"
          strokeWidth="3.4"
          strokeDasharray="63"
          strokeLinecap="round"
          transform="rotate(-90 12 12)"
          className="anim-ring"
        />
      </svg>
    </Tile>
  );
}

/** Question bubble with typing dots. */
export function AskTile({ className }: TileProps) {
  return (
    <Tile className={className}>
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A3.5 3.5 0 0 1 4 12.5z"
          fill="var(--ink)"
        />
        {[8.3, 12, 15.7].map((cx, i) => (
          <circle
            key={cx}
            cx={cx}
            cy="9.6"
            r="1.35"
            fill="var(--card)"
            className="anim-dot"
            style={{ animationDelay: `${i * 0.16}s`, transformBox: "fill-box" }}
          />
        ))}
      </svg>
    </Tile>
  );
}

/** Receipt with a check stamp popping in. */
export function ReceiptTile({ className }: TileProps) {
  return (
    <Tile className={className}>
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M5 2.5h14v19l-2.3-1.5-2.4 1.5-2.3-1.5-2.3 1.5-2.4-1.5L5 21.5z"
          stroke="var(--ink)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M8.5 7h7M8.5 10.5h5" stroke="var(--line-strong)" strokeWidth="1.8" strokeLinecap="round" />
        <g className="anim-stamp" style={{ transformBox: "fill-box" }}>
          <circle cx="15" cy="15.5" r="4" fill="var(--owned)" />
          <path d="m13.2 15.5 1.3 1.3 2.4-2.5" stroke="var(--card)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </Tile>
  );
}

/** Magnifier scanning across lines. */
export function LensTile({ className }: TileProps) {
  return (
    <Tile className={className}>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M3 6h18M3 12h18M3 18h12" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
        <g className="anim-scan">
          <circle cx="11" cy="11" r="5.2" fill="var(--card)" fillOpacity="0.7" stroke="var(--ink)" strokeWidth="2.2" />
          <path d="m15 15 4.2 4.2" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </svg>
    </Tile>
  );
}

/** Shield with a blinking observation tick. */
export function ShieldTile({ className }: TileProps) {
  return (
    <Tile className={className}>
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.8 19.5 5.6v5.8c0 4.6-3.1 8.2-7.5 9.8-4.4-1.6-7.5-5.2-7.5-9.8V5.6z"
          stroke="var(--ink)"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <path d="M12 7.5v5" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.5" fill="var(--contributed)" className="anim-blink" />
      </svg>
    </Tile>
  );
}

/** Small amber full stop used after display headlines. */
export function AmberDot() {
  return (
    <span
      aria-hidden
      className="ml-[0.04em] inline-block h-[0.16em] w-[0.16em] rounded-full align-baseline"
      style={{ background: "var(--surface)" }}
    />
  );
}
