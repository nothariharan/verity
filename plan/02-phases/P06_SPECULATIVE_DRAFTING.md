# P6 — Speculative drafting

**Status:** todo · **Time box:** 3–4 h · **Depends on:** P5

## Goal
The next question is ready when the candidate stops. Implements `04-intelligence/SPECULATIVE_DRAFTING.md`.

## In scope
- Drafter loop keeping Draft A and Draft B fresh (versioned, ≤ 1 in flight, stale responses dropped).
- Branch pick on early end-of-turn; TTS context pre-open; discard on turn resumed.
- Commit on end of turn; one re-pick if the assessor disagrees before audio starts.
- Fallbacks (sync draft with a 2 s timeout → precomputed opening).
- Board NOW panel: "Prepared while you were speaking · branch A/B".
- Metrics: `draft_ready_at_eot`, `branch_agreement`, `eot_to_audio`.

## Tests
- Integration (fakes with delays): drafts refresh on new segments; a stale draft response is ignored; turn resumed discards the pre-open; the assessor-disagrees path re-picks before audio and does not re-pick after audio starts.
- Fault: drafter 3 s delay → fallback used, logged.
- Latency harness: 20 real turns.

## Verification gate
- [ ] `draft_ready_at_eot` ≥ 90% over 20 turns
- [ ] `branch_agreement` ≥ 80% over 20 turns
- [ ] `eot_to_audio` p50 ≤ 900 ms (logged with machine + network)
- [ ] No question ever spoken that wasn't committed first (invariant check)
