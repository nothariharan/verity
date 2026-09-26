# Voice Spec — the floor

Verity's voice should feel like a person who listens: always hearing, never talking over you, quick to reply, quiet acknowledgements when you're mid-thought. **The voice never chooses words.** It speaks committed questions only (ADR-003).

## 1. Two open streams
- **Candidate → server:** mic open for the entire session, *including while Verity speaks*. `getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true, channelCount:1}})` → AudioWorklet → 16 kHz PCM16, 20 ms frames → WS binary → Deepgram + `candidate.wav`.
- **Server → candidate:** ElevenLabs PCM → `verity.wav` + WS binary tagged by questionId → player worklet → GainNode → output.

## 2. Floor states
```
          END_OF_TURN + committed question
 ┌────────┐ ───────────────────────────────► ┌───────┐
 │ LISTEN │                                  │ SPEAK │
 └────────┘ ◄─────────────────────────────── └───────┘
   │   ▲          playback ended                 │
   │   │                                         │ candidate clause confirmed
   ▼   │ clip done                               ▼
 ┌─────┐                                     ┌───────┐
 │ ACK │                                     │ YIELD │──► LISTEN
 └─────┘                                     └───────┘
```

### LISTEN
- STT streams; partials → `SEGMENT_PARTIAL`; finals → `SEGMENT_FINAL`.
- **Turn detection:** Flux turn events (`EARLY_END_OF_TURN`, `TURN_RESUMED`, `END_OF_TURN`) when available. Fallback (Nova-3): endpoint 700 ms base; hold up to 3.0 s if the last words are a connective/filler (`because, and, so, but, then, which, like, um, uh, I mean, basically`); hold 1.5 s after < 3 words unless it's a complete short answer ("yes", "no", "I'm not sure"). Early end-of-turn in fallback mode = endpoint − 300 ms.
- Text mode: `TEXT_ANSWER` = immediate `END_OF_TURN`.

### ACK (acknowledgement)
- Trigger: candidate speaking ≥ 15 s, then a 300–700 ms pause at a clause boundary, ≥ 20 s since the last ACK, and not within 5 s of an expected end of turn.
- The browser plays a local clip (`mmhm`, `right`, `go_on`, `got_it`) at about −12 dBFS. VAD ignores clip playback + 150 ms. It never ends the candidate's turn and never calls TTS.

### SPEAK
1. Commit (`QUESTION_COMMITTED`), then play the pre-opened TTS context or open one now.
2. Forward chunks with the questionId tag; `VERITY_AUDIO_STARTED` on the first chunk; log `eot_to_audio_ms`.
3. The mic stays hot. Candidate partials during SPEAK go through the **echo guard** first.
4. `PLAYBACK ended` → `VERITY_AUDIO_ENDED` → LISTEN.

### YIELD (barge-in, two-stage per ADR-010)
1. **Duck (browser, ≤ 50 ms):** VAD speech during playback → gain 0.15, send `VAD {speaking:true}`.
2. **Confirm (server, within 800 ms):** a candidate partial during SPEAK with ≥ 3 words, not only filler/ack tokens (`yeah, mm-hm, okay, right, sure, uh-huh`), passing the echo guard → `YIELD` → browser stops and flushes; server closes the TTS context and drops queued chunks; `QUESTION_INTERRUPTED {atChar}` (from TTS alignment if available, else the elapsed/duration ratio).
3. **No confirmation** → the browser restores gain.
The drafter receives the interrupted question, so Verity responds to what was said instead of repeating itself.

## 3. Echo guard
- Primary: browser AEC plus **headphones on stage**.
- Secondary: drop candidate partials during SPEAK whose token-set similarity to the currently spoken text is ≥ 0.8.
- Tested with laptop speakers in `07-testing/VOICE_TEST_SCRIPT.md`.

## 4. ElevenLabs Flash (verify parameters against current docs in P4)
- Multi-context WebSocket, `model_id=eleven_flash_v2_5`, one context per question, close on yield.
- Send whole sentences (or complete clauses if `TTS_CLAUSE_STREAMING`), with `auto_mode` for low latency on complete text.
- PCM output (16/22.05/24 kHz as supported); the worklet resamples.
- Request alignment when available (interruption offset, caption sync).
- Voice: one calm, warm, professional voice, chosen once in P4 and recorded as an ADR. Fixed voice settings in config.
- **Speech normalization** for TTS input only: `k8s` → "Kubernetes", `p95` → "P ninety-five", `QPS` → "queries per second", `50k` → "fifty thousand". Committed text stays as written.
- Ack clips are generated once with the same voice → `apps/web/public/audio/acks/`.

## 5. Deepgram (verify parameters in P3)
- Flux conversational model preferred (turn events); Nova-3 fallback with `interim_results`, `endpointing`, `utterance_end_ms`, `smart_format`, `punctuate`.
- Keyterm boost from extractor `keyterms` (Kafka, FAISS, HNSW, …).
- Keep the connection alive during SPEAK.
- `sessionMs = streamStartMs + word.start·1000`.

## 6. Latency instrumentation
`LATENCY_SAMPLE` segments: `eot_detect`, `draft_ready_at_eot`, `tts_first_audio`, `eot_to_audio`, `duck`, `yield_confirm`, `yield_stop`, `evidence_to_ring`. The harness reports p50/p95.
