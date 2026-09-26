# P3 — Listening

**Status:** todo · **Time box:** 4–6 h · **Depends on:** P2

## Goal
The candidate speaks; partials stream; turns end naturally (Flux events or fallback rules); the ring moves **provisionally while they talk**.

## In scope
- Mic worklet (16 kHz PCM16, 20 ms), WS binary upload.
- `providers/stt/real.ts` (Deepgram Flux preferred, Nova-3 fallback) + FakeStt script player.
- `session/turns.ts`: Flux turn events, or fallback endpoint + hold rules; emit `EARLY_END_OF_TURN` / `TURN_RESUMED` / `END_OF_TURN`.
- Keyterm boosting from the extractor.
- `recorder.ts` → `candidate.wav` aligned to the session clock.
- Live evaluator (prompt v1, ≤ 1 in flight) → provisional `BELIEF_UPDATED`.
- Browser VAD (`@ricky0123/vad-web`, energy fallback).
- Candidate screen: captions, floor pill.

## Tests
- Unit (fallback rules): "…because" + 2 s pause → no end of turn; a complete sentence + 800 ms → end of turn; "Yes." → end after the 1.5 s hold.
- Unit: word timestamps → session clock.
- Integration (FakeStt): a strong scripted answer → provisional update **before** `END_OF_TURN`, confirmed after; a buzzword list → no provisional update.
- Manual: `VOICE_TEST_SCRIPT.md` rows V1–V3, V9, V10.

## Verification gate
- [ ] Partials visibly under 1 s behind speech (screen recording saved)
- [ ] The thinking pause doesn't end the turn 5/5
- [ ] Provisional ring move during the demo strong answer 4/5; buzzword list 0/5
- [ ] `candidate.wav` aligns with word timings within ±250 ms (3 spot checks)
- [ ] ADR added if Flux vs Nova-3 was decided by measurement
