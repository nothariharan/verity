# P5 — Duplex floor

**Status:** todo · **Time box:** 5–7 h · **Depends on:** P4 · **Highest engineering risk**

## Goal
LISTEN / ACK / SPEAK / YIELD behave as in `03-voice/VOICE_SPEC.md`. The candidate can interrupt; Verity stops at once, never talks over them, and never yields to its own echo.

## In scope
- `voice-fsm.ts`: explicit transition table, `VOICE_STATE` events, illegal transitions throw.
- Two-stage barge-in (duck → confirm → `YIELD` → flush + context close + `QUESTION_INTERRUPTED`).
- `echo-guard.ts`.
- ACK trigger + local clip playback excluded from VAD.
- The drafter receives interrupted-question context.

## Tests
- Unit: every state × event in the FSM table.
- Unit: echo guard (Verity's own text transcribed → filtered; a genuine interruption → passes).
- Unit: fillers never confirm a yield; ≥ 3 real words do.
- Integration (Fake STT/TTS): interruption at 40% of playback → `YIELD`, no more chunks for that tag, the next question differs from the interrupted one.
- Manual: all of `VOICE_TEST_SCRIPT.md`.

## Verification gate
- [ ] Duck p95 ≤ 50 ms; stop p95 ≤ 150 ms after `YIELD` (latency log)
- [ ] 10/10 real interruptions stop Verity; 0/10 "mm-hm/yeah/cough" do
- [ ] Laptop speakers, no headset: no self-yield in 5/5, or "headset required" recorded and the stage setup confirmed
- [ ] ACK fires in a 25 s monologue without taking the turn
- [ ] After an interruption the next question responds to what was said
