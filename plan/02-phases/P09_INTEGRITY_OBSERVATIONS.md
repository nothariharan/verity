# P9 — Integrity observations

**Status:** todo · **Time box:** 3–5 h · **Depends on:** P8

## Goal
Neutral, timestamped observations on the board rail and dossier timeline, per `06-integrity/INTEGRITY_SPEC.md`. Build in signal order and stop when time runs out.

## In scope
1. Focus/visibility.
2. Silence-then-fluent timing note.
3. Possible second voice (diarization).
4. Optional on-device gaze/head/extra face with calibration, off by default.
- Consent card copy; disclaimer wherever observations show.

## Tests
- Unit: focus debounce (1.4 s → none; 1.6 s → event); silence-then-fluent rule on scripted timings.
- E2E: Playwright hides the page for 3 s → `FOCUS_LOST` attached to the current question, visible in the dossier.
- Copy lint for banned words.
- Manual (only if gaze is built): 10 natural thinking glances → 0 events; 3 × 3 s reading from a second screen → 3 events; venue-like lighting.

## Verification gate
- [ ] Focus observation reliable 5/5
- [ ] Copy lint green
- [ ] Gaze either passes the manual test on the demo laptop or stays disabled
