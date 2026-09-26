# P8 — Receipts dossier

**Status:** todo · **Time box:** 5–6 h (minimal version 2–3 h for the 24 h build) · **Depends on:** P7 (or P5 in the 24 h build)

## Goal
`/dossier/[id]` turns the event log into a receipts dossier: case cards with clips, a time scrubber that replays the board, role coverage, depth, right of reply, and a chain-verified record.

## Minimal version (24 h build)
Counts by status, case cards with receipts, working ▶ clips, chain status.

## Full scope
- `dossier/build.ts` (pure function of events) + HTTP endpoint.
- Audio endpoint with Range; `ClipPlayer` seeks the window and highlights the quote.
- **Time scrubber:** reducer over events ≤ t, rendering the board; receipt ticks jump to moments.
- Role coverage (Required → Claimed → Settled), depth per case.
- Right-of-reply question in the session arc (policy §3) + its receipts labeled "added in reply".
- Practice mode "Where to go deeper".
- Optional AI summary (summary.v1) strictly from receipts, labeled as AI-written.
- Print styles.

## Tests
- Unit: dossier builder snapshot on `fixtures/events/demo_session.jsonl`.
- Unit: clip window math, 20 s cap, clamping at the session edges.
- Unit: scrubber state at t equals the board state recorded live at t (fixture).
- E2E: finish the scripted session → dossier → click the first receipt → `audio.currentTime` ≈ clip start and the quote highlighted.
- Copy check: the string "score" appears nowhere in the dossier UI.

## Verification gate
- [ ] Every settled case has ≥ 1 receipt with a playable clip
- [ ] 3/3 spot-checked clips contain the quoted words
- [ ] Scrubber replay matches live states at 3 sampled times
- [ ] Tampering a stored event shows the "altered after event N" banner
- [ ] Right of reply asked in a full-length session (event log saved)
