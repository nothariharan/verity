# P2 — Case board

**Status:** todo · **Time box:** 4–6 h · **Depends on:** P1

## Goal
`/board/[id]` shows the live investigation: belief rings that tween on every update, the active case with its "why", a receipts stream, and the transcript, all from events.

## In scope
- `BeliefRing` component (three arcs, provisional dashed style, conflict notch, status chip).
- Deterministic grid layout (`layout.ts`), ≤ 12 cases, skills row.
- NOW panel: case, kind, why, tied pair, branch label.
- Receipts stream (quote, type, Δ toward a hypothesis).
- Transcript pane (partials lighter).
- Header with a chain-intact indicator.
- Dev "replay" control: feed a recorded event log at 1× / 4× (rehearsal + tests).

## Tests
- Unit: `layout.ts` is deterministic, and belief changes never move nodes.
- Unit: `BeliefRing` arc math (sums to 360°, min visible arc for 0.03).
- E2E (Playwright, fake providers): scripted session → the hero case's `data-owned` rises, a receipt card appears, the status chip becomes "Owned".
- Visual: screenshot of the board mid-session saved to `logs/evidence/`.

## Verification gate
- [ ] Ring tween starts ≤ 300 ms after a `BELIEF_UPDATED` event (measured in e2e)
- [ ] No node moves during a full scripted session
- [ ] Reload mid-session restores the identical board
- [ ] A judge-style test: someone new to the project explains the board in < 20 s (note who and what they said)
