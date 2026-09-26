# 03 — System Architecture & Full-Duplex Voice Engineering

> **Target Platform:** Verity (formerly SocraticHire)  
> **Hackathon Track:** AI/ML Track — Problem Statement: AI-Powered Interview Bot  
> **Engineering Invariant:** *The Floor Never Waits on the Mind.*  
> **Source Document:** Curated for NotebookLM Ingestion & Technical Architecture Explanation

---

## 1. High-Level Architectural Topology

Verity is engineered as a high-throughput, low-latency client-server duplex system. All components are bound by strict TypeScript Zod contracts across a single unified monorepo.

```
 BROWSER CLIENT — apps/web (Next.js 16)          REALTIME SERVER — apps/server (Fastify + WS)
┌──────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│ • Mic Worklet (16kHz PCM16 streaming)│──bin─►│ SessionHub (Per-interview coordinator)       │
│ • Client VAD (Duck & Barge-in trigger│──ctl─►│  ├─ Ears: Deepgram Flux Streaming STT         │
│ • Player Worklet (Zero-latency flush)│◄─bin──│  ├─ Mouth: ElevenLabs Flash v2.5 TTS (WS)     │
│ • Local Backchannel Cache ("mhm")    │       │  ├─ Floor: 4-State Duplex Voice FSM          │
│ • MediaPipe FaceLandmarker (Edge WASM│──tel─►│  ├─ Audio Recorder (Stereo WAV timestamped)  │
│ • Live 2D Case Board & Belief Rings  │◄─evt──│  └─ Append-Only Event Log (SHA-256 Chained)   │
│ • Dossier & Time Scrubber            │       │                                              │
└──────────────────────────────────────┘       │ The Mind (Asynchronous, Never Blocks Floor)  │
                                               │  ├─ Extractor: Resume + JD ──► Case Graph    │
                                               │  ├─ LiveEval: Mid-turn provisional belief    │
                                               │  ├─ Drafter: Speculative Dual-Drafts (A & B) │
                                               │  ├─ Assessor: Turn-end likelihoods & receipts│
                                               │  ├─ Consistency Ledger: Cross-claim facts    │
                                               │  └─ Policy: Max Information-Gain selector    │
                                               │ Storage: libSQL / SQLite (Drizzle ORM)       │
                                               └──────────────────────────────────────────────┘
```

---

## 2. The 4-State Duplex Voice Loop (State Machine)

To mimic human conversational timing without conversational collision, Verity implements a formal 4-state Finite State Machine (FSM):

```
                        ┌──────────────────────────────┐
                        │            LISTEN            │◄─────────────────────────┐
                        │ • Hot mic continuously open │                          │
                        │ • LiveEval provisional shift │                          │
                        │ • Drafter creates Draft A & B│                          │
                        └──────────────┬───────────────┘                          │
                                       │                                          │
            Connective pause (400ms)   │  Definite end of turn                    │
            (e.g., "because... uh...") │  (STT turn boundary)                     │
                                       ▼                                          │
                        ┌──────────────────────────────┐                          │
                        │         BACKCHANNEL          │                          │
                        │ • Play browser clip: "mhm"   │                          │
                        │ • Volume: -12 dBFS           │                          │
                        │ • Cost: $0.00 | Latency: 0ms │                          │
                        └──────────────┬───────────────┘                          │
                                       │                                          │
                          Answer ends  ▼                                          │
                        ┌──────────────────────────────┐                          │
                        │            SPEAK             │                          │
                        │ • Pick pre-drafted question  │                          │
                        │ • Commit text to Event Log   │                          │
                        │ • Stream ElevenLabs audio    │                          │
                        └──────────────┬───────────────┘                          │
                                       │                                          │
       Candidate interrupts mid-speech │                                          │ Verity finishes
       (VAD vocal energy > 80ms)       │                                          │ question cleanly
                                       ▼                                          │
                        ┌──────────────────────────────┐                          │
                        │            YIELD             │                          │
                        │ • Instant audio flush (<20ms)│──────────────────────────┘
                        │ • Abort downstream TTS ws    │
                        │ • Keep transcript in ledger  │
                        └──────────────────────────────┘
```

### Detailed State Mechanics:
1. **`LISTEN` (Continuous Hearing & Speculative Preparation):**
   * The candidate speaks freely. The client microphone worklet packages audio into 100ms PCM16 chunks streamed over binary WebSocket frames to Deepgram Flux.
   * As interim words stream in, **LiveEval** updates the target case's belief ring provisionally (rendered as a dashed, fluid ring movement on the candidate and recruiter UI).
   * In parallel, the **Speculative Drafter** continuously generates and updates two competing follow-up questions:
     * **Draft A:** Probes deeper architectural ownership if the candidate confirms technical control.
     * **Draft B:** Probes foundational mechanics if the candidate gives a surface-level buzzword answer.
2. **`BACKCHANNEL` (Active Human Presence):**
   * Humans naturally interject subtle acoustic acknowledgments (*"right"*, *"got it"*, *"mhm"*) to signal listening without stealing the floor.
   * If the candidate pauses for 400–600ms on a connective word (*"so we decided to... and..."*), Verity injects an on-device audio clip.
   * **Zero Cloud Hop:** The clip is played locally from browser memory. No server round-trip, zero API latency, zero inference cost.
3. **`SPEAK` (Committed Utterance):**
   * When Deepgram detects an end-of-turn boundary, the Policy Engine selects Draft A or Draft B based on the latest belief distribution.
   * **The Text-First Commitment:** The exact question string is committed to the hash-chained event log **before** audio synthesis begins.
   * The server pushes audio bytes from a pre-warmed ElevenLabs Flash v2.5 WebSocket connection directly to the client's audio playback worklet.
4. **`YIELD` (Sub-120ms Smart Barge-In):**
   * If the candidate interrupts Verity mid-question, browser-side VAD detects vocal energy exceeding threshold for $>80\text{ms}$.
   * The client player worklet zeroes gain instantly ($<20\text{ms}$) and purges all buffered audio.
   * The server terminates the ElevenLabs WebSocket stream, logs a `VERITY_AUDIO_INTERRUPTED` event, and returns immediately to `LISTEN`.

---

## 3. The Strict Separation: Floor vs. Mind

In traditional failed architectures, the voice bot attempts to run its intelligence logic inside the turn-taking critical path:
$$\text{Candidate finishes} \implies \text{Run 1,000-token LLM Prompt} \implies \text{Wait for Completion} \implies \text{Stream Audio}$$

This guarantees a disastrous 2.5-second awkward silence.

Verity decouples the **Floor** (the acoustic pipeline) from the **Mind** (the reasoning engine):

```
TIME ──►  0.0s              1.0s              2.0s              3.0s (Turn End)   3.4s
FLOOR:    [=== Candidate Speaking: "We used Raft consensus..." ===] ──► [Verity Speaks Q]
MIND:     [LiveEval: +15% Owned]  [Drafter: Pre-generates Draft A & B] ──► [Selects Draft A in 0ms]
```

* **The Mind operates asynchronously in parallel with candidate speech.**
* By the time the candidate stops talking, **Question $N+1$ is already written and cached in server RAM**.
* The turn transition requires **zero token generation latency**.

---

## 4. Latency Budget & Empirical Targets

Verity's system architecture guarantees strict, verifiable latency boundaries across every conversational segment:

| Segment | Target | Measured / Budgeted Physics |
| :--- | :--- | :--- |
| **End-of-Turn Boundary Detection** | $\le 500\text{ms}$ | Deepgram Flux conversational endpointing model |
| **Question Ready at Turn End** | $\mathbf{0\text{ms}}$ | Speculative drafting cache hit ($\ge 90\%$ of turns) |
| **TTS First Audio Chunk Delivery** | $\le 220\text{ms}$ | ElevenLabs Flash v2.5 over pre-warmed WebSocket |
| **Total Voice Turn-Around Time** | $\mathbf{\le 750\text{ms}}$ | **Undetectable to human conversational ear** |
| **Smart Barge-In Audio Mute** | $\le 40\text{ms}$ | Client-side AudioWorklet hardware gain flush |
| **Mid-Speech Provisional Ring Shift**| $\le 1,500\text{ms}$ | Lightweight heuristic classification on interim STT |

---

## 5. WebSocket Wire Protocol & Packet Framing

The client and server communicate via a single, full-duplex WebSocket connection multiplexing binary audio and JSON telemetry:

```
Binary Frames (Channel 0x01):
  [1-byte Header: 0x01 (Mic)] + [16-bit PCM Audio Samples @ 16,000 Hz]
  [1-byte Header: 0x02 (TTS)] + [16-bit PCM Audio Samples @ 24,000 Hz]

JSON Control Frames:
  { "type": "HELLO", "clientVersion": "1.0", "resumeId": "uuid" }
  { "type": "QUESTION_COMMITTED", "caseId": "uuid", "text": "...", "seq": 4 }
  { "type": "TRANSCRIPT_INTERIM", "text": "so we repartitioned the topic...", "isFinal": false }
  { "type": "BELIEF_UPDATED", "caseId": "uuid", "distribution": { "owned": 0.72, "contributed": 0.20, "surface": 0.08 }, "provisional": true }
  { "type": "RECEIPT_ISSUED", "receiptId": "uuid", "quote": "...", "audioRange": [12.4, 21.8] }
  { "type": "YIELD_FLOOR", "timestampMs": 14250 }
```

---

## 6. Monorepo Organization (`apps/` & `packages/`)

* **`apps/web` (Next.js 16 App Router):**
  * Minimalist Apple HIG dark-mode interface (`#090D16`).
  * Web Audio Worklets for raw PCM16 microphone capture and hardware-accelerated playback.
  * SVG / HTML Canvas 2D Case Board rendering up to 12 active belief rings with zero force-simulation jank.
* **`apps/server` (Fastify + `@fastify/websocket`):**
  * SessionHub managing live audio routing, Deepgram/ElevenLabs stream coordination, and the 4-state Voice FSM.
  * SHA-256 hash-chained transactional event log storing all state transitions.
* **`packages/contracts` (Single Source of Truth):**
  * Zod schemas defining all wire events, belief data models, receipt formats, and LLM structured output schemas.
