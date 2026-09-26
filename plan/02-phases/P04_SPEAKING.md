# P4 — Speaking

**Status:** todo · **Time box:** 3–5 h · **Depends on:** P3

## Goal
Every committed question is spoken by ElevenLabs Flash, starting on the first audio chunk, with the mic still live.

## In scope
- `providers/tts/real.ts`: multi-context WebSocket, one context per question, pre-open support, close support; FakeTts (paced PCM).
- Player worklet: tagged chunks, stale-tag dropping, gain node, flush.
- `verity.wav` recorder.
- Speech normalization for TTS input.
- Pick the voice → ADR with the voice ID. Generate the 4 ack clips in that voice.
- Latency samples: `tts_first_audio`, `eot_to_audio`.

## Tests
- Unit: chunk framing/tag parsing; the player drops stale tags (mock worklet port).
- Integration (FakeTts): `QUESTION_COMMITTED` → `VERITY_AUDIO_STARTED` → `VERITY_AUDIO_ENDED` → LISTEN, in order.
- Latency harness: 10 real turns on the demo laptop over the hotspot.
- Failure: invalid TTS key → text + chime, the session continues.

## Verification gate
- [ ] 10/10 spoken text matches committed text (3 spot-checked by ear)
- [ ] `tts_first_audio` p50/p95 logged; p95 ≤ 400 ms (else try clause streaming and re-measure)
- [ ] `eot_to_audio` p50 logged (synchronous drafting, so expect it to be slower than the P6 target)
- [ ] Partials still arrive while Verity speaks (with headphones)
- [ ] TTS failure drill passes
