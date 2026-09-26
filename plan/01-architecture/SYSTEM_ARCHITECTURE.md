# System Architecture

```
 BROWSER — apps/web (Next.js)                     REALTIME SERVER — apps/server (Fastify + WS)
┌──────────────────────────────────┐            ┌──────────────────────────────────────────────┐
│ Mic worklet → PCM16 16k frames   │── binary ─►│ SessionHub (one per interview)                │
│ VAD → duck + VAD msgs            │── json ───►│  ├─ Ears: SttProvider (ElevenLabs Scribe RT)  │
│ Player worklet (gain, flush)     │◄─ binary ──│  ├─ Mouth: TtsProvider (ElevenLabs Flash)     │
│ Ack clips (local)                │            │  ├─ Floor: VoiceFSM (LISTEN/ACK/SPEAK/YIELD)  │
│ Integrity sensors (local)        │── json ───►│  ├─ Recorder (candidate.wav, verity.wav)      │
│ Store ← event stream             │◄─ events ──│  └─ EventLog (hash chain) → projections → WS  │
│ Text-mode input                  │── json ───►│                                              │
└──────────────────────────────────┘            │ Mind (never blocks the floor)                 │
                                                │  ├─ Extractor   (setup: resume+JD → cases)    │
                                                │  ├─ LiveEval    (mid-turn: provisional belief) │
                                                │  ├─ Drafter     (mid-turn: drafts A and B)     │
                                                │  ├─ Assessor    (turn end: likelihoods→belief) │
                                                │  ├─ Ledger      (facts, suspected conflicts)   │
                                                │  └─ Policy      (case + kind selection, code)  │
                                                │ Store: SQLite/libSQL (Drizzle) + audio files  │
                                                └──────────────────────────────────────────────┘
```

## Principles
1. **The floor never waits on the mind.** Only a committed question sits between end of turn and voice, and speculative drafting makes it ready before the turn ends.
2. **The event log is the product's memory.** Board, receipts, dossier, scrubber, and audit are all projections of one hash-chained stream.
3. **One clock.** The server session clock stamps events, transcript words, and audio samples.
4. **Every provider has a Fake.** `PROVIDERS=fake` runs the full product offline and deterministically.

## A turn, end to end
```
Verity speaks Q(case=c, kind=k) ── candidate starts answering
   │
   ├─ interim transcript ──► LiveEval (≤1 in flight, ~every 1.5 s)
   │                            └─► BELIEF_UPDATED {provisional:true}   (ring moves, dashed)
   ├─ interim transcript ──► Drafter keeps Draft A / Draft B fresh      (DRAFT_UPDATED, internal)
   ├─ facts in transcript ─► Ledger.check ──► CONFLICT_SUSPECTED?      (marks reconcile priority)
   │
   ├─ EARLY_END_OF_TURN ──► Policy picks branch from provisional belief; TTS context pre-opened
   ├─ TURN_RESUMED ───────► discard pre-open
   └─ END_OF_TURN
         ├─► commit chosen draft → QUESTION_COMMITTED → TTS play → VERITY_AUDIO_STARTED
         └─► Assessor (parallel) → RECEIPT_CREATED(s) → BELIEF_UPDATED {provisional:false}
                 └─ if the result flips the branch and audio hasn't started → re-pick once
```

## Latency budget (targets; nothing is quoted until measured)
| Segment | Target |
|---|---|
| End-of-turn detection (candidate stops → signal) | ≤ 500 ms typical |
| Draft ready at end of turn | already ready (≥ 90% of turns) |
| TTS first audio (pre-opened context) | ≤ 250 ms |
| **Candidate stops → Verity's voice** | **≤ 900 ms stage target, ≤ 700 ms stretch** |
| Duck on candidate speech | ≤ 50 ms |
| Full stop after `YIELD` | ≤ 150 ms |
| Evidence spoken → provisional ring move | ≤ 2.5 s |

Every segment is emitted as `LATENCY_SAMPLE` and aggregated by the latency harness.

## Failure handling
| Failure | Behavior |
|---|---|
| STT down | Session switches to text mode; banner; engine unchanged |
| TTS down / rate-limited | Question shown as text with a soft chime |
| No draft ready | Synchronous draft call; if > 2 s, use the case's precomputed opening question |
| Assessor timeout | Keep the provisional belief marked provisional; retry once in the background |
| WS drop | Client reconnects with `lastSeq`; server replays |
| Chain verification fails | Dossier shows "record altered after event N". Never hide it. |

## Runtime topology (demo)
Everything on the demo laptop: web :3000, server :8787, SQLite file, audio under `apps/server/data/`. Headset, wired power, phone hotspot as backup. An optional hosted copy (web on Vercel, server on Fly/Railway) is nice-to-have, never the demo path.
