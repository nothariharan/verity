# P10 — Polish and hardening

**Status:** todo · **Time box:** ≥ 4 h reserved · **Depends on:** P9 (or P8-minimal in the 24 h build)

## Goal
The demo runs cleanly twice in a row on the demo laptop and network, every fallback has been drilled, and the deck is done with only measured numbers.

## In scope
- Visual polish to the design language (`05-frontend/SCREENS.md`); empty, loading, and error states.
- Demo fixtures final; the three hero cases reliably extracted (or pinned and logged as seeded).
- Fallback drills: STT → text mode, TTS failure, drafter timeout, WS drop, network → hotspot.
- Record one perfect run with the replay tool plus a screen recording as the offline backup.
- Fill `BNB-IDEA-Presentation-Format.pptx` per `08-demo-and-pitch/DECK_PLAN.md`.

## Tests
- Regression sweep; `07-testing/DEMO_REHEARSAL.md` twice.

## Verification gate
- [ ] Two consecutive clean rehearsals, timed and logged
- [ ] Every fallback drilled once
- [ ] Backup recording plays offline
- [ ] Every number in the deck/pitch traces to `VERIFICATION_LOG.md` or a read citation
