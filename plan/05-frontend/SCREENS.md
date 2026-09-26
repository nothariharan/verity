# Frontend — screens and design language

Next.js latest (App Router), TypeScript, Tailwind, `@xyflow/react` for the board, zustand store driven by one event reducer (`lib/store.ts`). No polling; everything is event-driven with reconnect + replay.

Route map (ADR-019): `/` landing (see `LANDING.md`) · `/app` recruiter dashboard, `/me` student dashboard (see `DASHBOARDS.md`) · `/interview/[id]` candidate · `/app/live/[id]` live case board (was `/board/[id]`) · `/app/dossier/[id]` and `/me/report/[id]` dossier.

## Design language: "forensic case file" (light, warm; ADR-019)
- Warm off-white canvas `#F8F6F2`, ink `#111111`, muted `#77736D`, hairline `#E5E1DA`, white cards with a soft shadow and 16 px radius. Calm, editorial, evidence-first. The page stays neutral; accents live only on product visuals.
- Hypothesis colors (used everywhere, including the ring):
  - **Owned** `#3F8F62` (green)
  - **Contributed** `#5B7DB1` (muted blue)
  - **Surface** `#D99A2B` (amber)
  - Conflict flag `#C85A52` · Open `#9A958E` · Active focus ring `#111111`
- Type: Geist Sans (tight tracking on display sizes) and Geist Mono for timestamps, quotes, and hashes.
- Candidate presence: the provided `FluidOrb` wrapped by `VoiceOrb` (scale/glow from voice state and audio level).
- Motion: belief ring segments tween over 600 ms; provisional = dashed segments with a slow shimmer; settle = one pulse and the ring goes solid; receipt = a card slides into the stream. Respect `prefers-reduced-motion`.

## The belief ring (signature component)
A ring around each case node, split into three arcs proportional to `owned / contributed / surface`. A center label shows the case label; a small status chip underneath (Investigating · Owned · Contributed · Surface · Open). A rose notch appears when `conflict`. Provisional arcs are dashed. The same component is used large in the dossier.

## 1. Setup `/`
Upload resume (PDF/TXT/MD), paste or upload the JD, duration (10/15/20 min), mode (Recruiter / Practice), "Use demo candidate". After extraction: cases appear as rings with their priors, and required skills with no claim appear as outlined chips. Buttons: **Start interview** (opens `/interview/[id]`) and **Open case board** (new window).

## 2. Candidate `/interview/[id]`
Calm and minimal. No board, no beliefs.
- Center: presence visual (`VoiceOrb` over the provided `FluidOrb`; the 3D Lens in P11 is optional).
- The current question as text, fading in with the audio.
- Captions (last two lines), floor pill (Listening · Verity speaking · You're speaking), timer.
- Always-visible small **Type instead** toggle (text mode).
- A pre-start consent card in plain language: what's recorded (audio, transcript, tab focus; camera signals only if enabled and processed on-device), why, and for how long.

## 3. Case board `/board/[id]` (projected in the demo)
```
┌─ header: role · candidate · timer · record-intact indicator ───────────────────────┐
│ ┌── CASES (2D, ≤12, deterministic grid ordered by importance) ──┐ ┌─ NOW ─────────┐ │
│ │  ◔ Kafka · 50k ev/s   ◑ RAG · 100k docs   ◕ 40% latency cut    │ │ case + ring   │ │
│ │  ○ K8s autoscaling    ○ LoRA fine-tune    ...                   │ │ question kind │ │
│ │  skills row underneath with thin links                          │ │ why this      │ │
│ └──────────────────────────────────────────────────────────────────┘ │ tied pair     │ │
│ ┌── RECEIPTS STREAM (newest first) ──────────────┐ ┌─ TRANSCRIPT ──┐ │ "prepared     │ │
│ │ ▸ "keyed by user_id with murmur3…"  +0.22 Owned │ │ live, partials│ │  while you    │ │
│ └─────────────────────────────────────────────────┘ └───────────────┘ │  were talking"│ │
│ integrity ticks on a thin time rail                                     └───────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
- The active case is enlarged with a focus ring. The others dim slightly.
- Layout is a pure function (`layout.ts`); nodes never move when beliefs change.

## 4. Dossier `/dossier/[id]`
- Header: role, date, duration, counts (Owned 3 · Contributed 2 · Surface 1 · Open 2 · Conflicts 0). **No overall score.** Chain status: "Record intact · 214 events" (or the altered-after warning).
- **Time scrubber:** a slider across the session. Dragging replays the board at that moment (reducer over events ≤ t). Receipts along the rail as ticks; click one to jump.
- **Case cards:** large ring, final status, the question chain (kind + text), receipts with ▶ clip (plays the candidate track window, highlights the quote in the transcript), and before → after belief.
- **Role coverage:** Required → Claimed → Settled per skill.
- **Depth:** per case, "Depth shown in this interview".
- **Observations:** neutral timeline + disclaimer "Observations only, not evidence of misconduct."
- **Practice mode:** "Where to go deeper": Open and Surface cases with the exact question to prepare for.
- Print-friendly.

## Accessibility
Keyboard reachable, visible focus, captions always available, colors paired with text labels (never color alone), contrast AA.
