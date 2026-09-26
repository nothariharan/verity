# Full Build & Implementation Plan: Architecture, Protocols, and 48-Hour Execution Roadmap

> **Hackathon Research Subpage 09: Production Engineering Blueprint**  
> **Domain:** AI/ML Track — AI-Powered Interview Bot  
> **Target System:** SocraticHire / Verity Full-Duplex Architecture  
> **Core Stack:** TypeScript End-to-End (Next.js 16 App Router, Fastify WebSocket, Zod Contracts, SQLite/libSQL via Drizzle)

---

## 1. Executive Summary & Guiding Architectural Invariants

Building a responsive, full-duplex conversational voice interviewer that investigates resume claims in real-time requires strict separation of concerns. Most failed voice AI bots attempt to pipeline Speech-to-Speech models directly into the conversation loop, creating uncontrollable hallucinations, awkward turn-taking collisions, and impossible-to-audit scoring black boxes.

SocraticHire enforces **six non-negotiable architectural invariants**:

1. **The Floor Never Waits on the Mind:** The audio playback pipeline must never stall waiting for a heavy LLM inference step. The next question is speculatively pre-drafted *while* the candidate is mid-sentence.
2. **Text-First Commitment:** Every interviewer question is committed to the hash-chained event log as plain text *before* TTS audio generation starts.
3. **Beliefs Move Only on Text:** Credibility assessments shift strictly on committed transcripts and questions—never on vocal acoustic pitch, emotional inflection, accent, or facial appearance.
4. **Append-Only Hash-Chained Event Log:** All state (case graph, belief rings, receipts dossier, and integrity timeline) is a deterministic projection of an append-only event stream.
5. **Deterministic Offline Capability (`PROVIDERS=fake`):** Every external service (Deepgram STT, ElevenLabs TTS, LLM) possesses a deterministic, zero-latency Fake provider, allowing offline testing and stage fallback.
6. **No Cheating Scores:** Authenticity metrics are logged as neutral, timestamped behavioral observations—never punitive probabilities or black-box disqualification flags.

---

## 2. Monorepo Repository Structure

The project is structured as a pnpm workspace with three core packages:

```
bnb-interview-bot/
├── apps/
│   ├── web/                           # Next.js 16 App Router (React 19)
│   │   ├── app/
│   │   │   ├── page.tsx               # Landing & Resume/JD Ingestion
│   │   │   ├── interview/[id]/        # Live Voice Studio & Case Board
│   │   │   └── dossier/[id]/          # Post-Interview Receipts & Scrubber
│   │   ├── components/
│   │   │   ├── case-board/            # 2D Deterministic Case Grid & Rings
│   │   │   ├── voice-orb/             # WebGL / Canvas Responsive Audio Waveform
│   │   │   ├── receipts-feed/         # Real-Time Evidence Cards
│   │   │   └── telemetry/             # Client-side MediaPipe Saccade Monitor
│   │   ├── hooks/
│   │   │   ├── use-voice-fsm.ts       # 4-State Duplex Voice Client Hook
│   │   │   └── use-session-socket.ts  # Binary/JSON WebSocket Reconnection Layer
│   │   └── worklets/
│   │       ├── mic-processor.ts       # PCM16 16kHz Chunk Streamer
│   │       └── player-processor.ts    # Low-Latency Chunk Player with Instant Flush
│   └── server/                        # Fastify Realtime Node.js Server
│       ├── src/
│       │   ├── index.ts               # Fastify Entrypoint + WS Gateway
│       │   ├── session/
│       │   │   ├── session-hub.ts     # Per-Interview Coordinator
│       │   │   └── voice-fsm.ts       # 4-State Floor Control State Machine
│       │   ├── log/
│       │   │   ├── event-log.ts       # Hash-Chained Transactional Event Appender
│       │   │   ├── chain.ts           # SHA-256 Chain Verification
│       │   │   └── projections.ts     # In-Memory State Projections
│       │   ├── intelligence/
│       │   │   ├── extractor.ts       # Resume & JD -> Case Graph Generator
│       │   │   ├── live-eval.ts       # Mid-Turn Fast Classifier (Provisional Belief)
│       │   │   ├── drafter.ts         # Speculative Dual-Draft Engine (Draft A / B)
│       │   │   ├── assessor.ts        # Turn-End Likelihood Evaluator & Receipt Issuer
│       │   │   ├── policy.ts          # Information-Gain Question Selector
│       │   │   └── ledger.ts          # Fact Consistency & Contradiction Tracker
│       │   └── providers/
│       │       ├── stt/               # Deepgram Streaming Provider + Fake
│       │       ├── tts/               # ElevenLabs Flash v2.5 Provider + Fake
│       │       └── llm/               # Fast Inference (Groq/Llama-3.3-70B) + Fake
│       └── db/
│           ├── schema.ts              # SQLite / libSQL Schema via Drizzle
│           └── migrations/
└── packages/
    └── contracts/                     # Shared Zod Schemas & TypeScript Types
        ├── src/
        │   ├── events.ts              # Canonical Event Schemas
        │   ├── cases.ts               # Case, Hypothesis, & Belief Schemas
        │   ├── receipts.ts            # Receipt & Evidence Audio Slice Schemas
        │   └── telemetry.ts           # Integrity Observation Schemas
        └── package.json
```

---

## 3. The 4-State Duplex Voice Loop (State Machine)

To guarantee sub-600ms conversational turn-around with natural interruption handling, the voice loop is governed by a formal 4-state Finite State Machine:

```
                  ┌──────────────────────────────┐
                  │            LISTEN            │◄───────────────────────┐
                  │ (Hot mic, candidate talks)   │                        │
                  └──────────────┬───────────────┘                        │
                                 │                                        │
                    Short pause  │  Natural cadence pause                 │
                    (400-700ms)  │  (Turn holding / connective)           │
                                 ▼                                        │
                  ┌──────────────────────────────┐                        │
                  │         BACKCHANNEL          │                        │
                  │ (Local browser audio: "mhm") │                        │
                  └──────────────┬───────────────┘                        │
                                 │                                        │
                    Definite End │                                        │
                    of Turn      ▼                                        │
                  ┌──────────────────────────────┐                        │
                  │            SPEAK             │                        │
                  │ (Play pre-drafted question)  │                        │
                  └──────────────┬───────────────┘                        │
                                 │                                        │
     Candidate interrupts mid-bot│                                        │ Bot speech
     (VAD speech onset > 80ms)   │                                        │ completes
                                 ▼                                        │ cleanly
                  ┌──────────────────────────────┐                        │
                  │            YIELD             │                        │
                  │ (Instant flush, discard TTS) │────────────────────────┘
                  └──────────────────────────────┘
```

### State Definitions & Latency Budgets
1. **`LISTEN` (Turn Holding):**
   * Mic stream is sampled at 16kHz PCM16, buffered into 100ms frames, and piped to STT.
   * As interim transcripts stream in, the **LiveEval** engine performs fast heuristic classification to move the target case ring provisionally (dotted boundary).
   * **Speculative Drafter** continuously maintains two candidate follow-ups: **Draft A** (if the candidate substantiates ownership) and **Draft B** (if the candidate remains vague or defensive).
2. **`BACKCHANNEL` (Active Listening Injection):**
   * If the candidate pauses for 500ms on a connective conjunction (*"and then... because..."*), a micro-affirmation clip (*"right"*, *"got it"*, *"mhm"*) is played at -12 dBFS directly from browser memory.
   * **Cost: $0.00. Latency: 0ms.** Verity does not yield the floor or trigger an LLM turn.
3. **`SPEAK` (Committed Speech):**
   * When `END_OF_TURN` is flagged by the STT model (e.g. Deepgram Flux turn-boundary), the policy engine immediately selects Draft A or Draft B based on provisional belief.
   * A `QUESTION_COMMITTED` event is stamped and broadcast.
   * Pre-opened ElevenLabs Flash v2.5 WebSocket pushes audio chunks directly to the client audio worklet. First audio is rendered in **< 250ms**.
4. **`YIELD` (Sub-120ms Smart Barge-In):**
   * If the client VAD detects candidate vocal energy exceeding threshold for > 80ms while Verity is speaking, the browser worklet instantly zeroes gain and flushes playback buffers in **< 20ms**.
   * Server aborts downstream TTS chunk generation, marks `VERITY_AUDIO_INTERRUPTED`, and returns smoothly to `LISTEN`.

---

## 4. Contract-First Data Models (`packages/contracts`)

All inter-service messages, WebSocket payloads, and LLM structured outputs are governed strictly by Zod contracts:

```typescript
import { z } from 'zod';

// --- Hypotheses & Beliefs ---
export const HypothesisSchema = z.enum(['OWNED', 'CONTRIBUTED', 'SURFACE']);
export type Hypothesis = z.infer<typeof HypothesisSchema>;

export const BeliefDistributionSchema = z.object({
  owned: z.number().min(0).max(1),
  contributed: z.number().min(0).max(1),
  surface: z.number().min(0).max(1),
});
export type BeliefDistribution = z.infer<typeof BeliefDistributionSchema>;

// --- Case Definition ---
export const CaseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  claim: z.string(),
  sourceExcerpt: z.string(),
  anchorHypothesis: HypothesisSchema,
  currentBelief: BeliefDistributionSchema,
  status: z.enum(['UNEXAMINED', 'ACTIVE', 'SETTLED', 'CONFLICT']),
  receiptIds: z.array(z.string().uuid()),
  displayOrder: z.number().int().min(0).max(11), // Max 12 cases on 2D board
});
export type Case = z.infer<typeof CaseSchema>;

// --- Receipts & Evidentiary Links ---
export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  turnIndex: z.number().int(),
  quote: z.string(),
  audioStartTimeMs: z.number(),
  audioEndTimeMs: z.number(),
  rationale: z.string(),
  priorBelief: BeliefDistributionSchema,
  posteriorBelief: BeliefDistributionSchema,
  timestamp: z.number(),
});
export type Receipt = z.infer<typeof ReceiptSchema>;

// --- Hash-Chained Event Envelope ---
export const EventTypeSchema = z.enum([
  'SESSION_CREATED',
  'CASE_DISCOVERED',
  'INTERVIEW_STARTED',
  'QUESTION_COMMITTED',
  'CANDIDATE_TRANSCRIPT_INTERIM',
  'CANDIDATE_TRANSCRIPT_FINAL',
  'BELIEF_UPDATED',
  'RECEIPT_ISSUED',
  'CONFLICT_RECORDED',
  'TELEMETRY_OBSERVED',
  'INTERVIEW_COMPLETED',
]);

export const ChainedEventSchema = z.object({
  seq: z.number().int().nonnegative(),
  sessionId: z.string().uuid(),
  type: EventTypeSchema,
  timestamp: z.number(),
  payload: z.record(z.any()),
  prevHash: z.string(),
  hash: z.string(), // SHA-256(seq + sessionId + type + timestamp + JSON.stringify(payload) + prevHash)
});
export type ChainedEvent = z.infer<typeof ChainedEventSchema>;
```

---

## 5. End-to-End WebSocket Wire Protocol

The browser client and Fastify backend communicate over a single WebSocket connection supporting multiplexed binary audio and JSON control frames:

```
Candidate Browser                                    Fastify Backend
       │                                                    │
       ├────────── WS Handshake (/ws/session/:id) ─────────►│
       │◄───────── HELLO { serverTime, lastSeq } ───────────┤
       │                                                    │
       ├────────── START_SESSION ──────────────────────────►│
       │◄───────── CASE_DISCOVERED (x 6-10 cases) ──────────┤
       │                                                    │
       │           === Turn 1: Bot Speaks ===               │
       │◄───────── QUESTION_COMMITTED { caseId, text } ─────┤
       │◄───────── [Binary Audio Stream: PCM16 Chunks] ─────┤
       │                                                    │
       │           === Turn 1: Candidate Responds ===       │
       ├────────── [Binary Audio Stream: 100ms Mic Chunks] ─►│
       │◄───────── CANDIDATE_TRANSCRIPT_INTERIM ────────────┤
       │◄───────── BELIEF_UPDATED { provisional: true } ────┤ (Ring shifts)
       │                                                    │
       │           === Turn End & Receipt Creation ===      │
       │◄───────── CANDIDATE_TRANSCRIPT_FINAL ──────────────┤
       │◄───────── RECEIPT_ISSUED { quote, clip, delta } ───┤ (Receipt card pops)
       │◄───────── BELIEF_UPDATED { provisional: false } ───┤ (Ring locks)
       │                                                    │
       │           === Next Question Already Ready ===      │
       │◄───────── QUESTION_COMMITTED { nextCaseId } ───────┤ (Latency: 350ms)
       │◄───────── [Binary Audio Stream: TTS Chunks] ───────┤
```

---

## 6. Implementation of the Intelligence Mind

### 6.1 Discriminative Question Policy
Verity never asks arbitrary questions. At any turn $t$, the question selector chooses the case $c^*$ that maximizes **separation entropy**:
$$\Delta H(c) = H(P_t(c)) - \mathbb{E}[H(P_{t+1}(c))]$$
Where $P_t(c) = [p_{\text{owned}}, p_{\text{contributed}}, p_{\text{surface}}]$.

The question generator is prompted with the two highest competing hypotheses (e.g. *Tied between Owned and Contributed*), producing a targeted question designed to expose architectural trade-off ownership:
* *Example Owned vs. Contributed Discriminator:* *"When the cache cluster hit split-brain during the October rollout, what specific quorum configuration did you change to resolve it?"*

### 6.2 The Speculative Drafter
While the candidate speaks, the server fires two parallel low-cost LLM completions:
* **Draft A (Separates Owned from Contributed):** Assumes the candidate correctly identified the technical architecture and challenges their specific ownership of the implementation.
* **Draft B (Separates Contributed from Surface):** Assumes the candidate used vague buzzwords and asks for a concrete line of code, CLI command, or failure recovery step.

When Deepgram signals `END_OF_TURN`, the chosen question is committed in **0ms computation time**.

---

## 7. Authenticity & Integrity: Diagnostics, Not Surveillance

In strict alignment with user specifications, authenticity monitoring is implemented as **telemetry diagnostics**:
* **Zero Video Streaming:** MediaPipe FaceLandmarker runs 100% inside client WebAssembly. No frames are transmitted to the server.
* **Sawtooth Saccade Detection:** FFT on horizontal iris coordinates detects reading teleprompters off external monitors.
* **Response Onset Latency ($CV_{\text{latency}}$):** Monitors unnervingly rigid 2.5s gaps indicative of Whisper + LLM copilot pipelines.
* **Reporting Output:** Added as neutral event log markers (`TELEMETRY_OBSERVED: { factor: 'SACCADE_SAWTOOTH', confidence: 0.88 }`), displayed in the Recruiter Dossier as a factual timeline rather than a punitive score.

---

## 8. 48-Hour Hackathon Execution Roadmap & Cut Lines

```
Hour 00 ──────── 12 ──────── 24 ──────── 36 ──────── 48
 │ Monorepo + Zod │ Case Board  │ Duplex Loop │ Dossier +  │ Rehearsal &
 │ Event Log      │ Text Mode   │ Barge-In    │ Telemetry  │ Deck Prep
 └────────────────┴─────────────┴─────────────┴────────────┴─────────────►
```

| Phase | Milestone | Deliverable | Timebox | Cut-Line Status |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | Foundations | Monorepo, Zod contracts, hash-chained log, Fakes, CI | 0h – 4h | **Must Have** |
| **P1** | Case Engine (Text) | Resume extractor, 3-hypothesis belief updater, typed mode | 4h – 10h | **Must Have** |
| **P2** | Case Board UI | Next.js live 2D case board, belief rings, receipts panel | 10h – 16h | **Must Have** |
| **P3** | Listening Loop | Deepgram streaming STT, interim transcripts, live provisional updates | 16h – 22h | **Must Have** |
| **P4** | Speaking Loop | ElevenLabs Flash v2.5 TTS, audio worklet player | 22h – 26h | **Must Have** |
| **P5** | Duplex Floor Control | Smart barge-in (<120ms flush), 4-state FSM, local backchannels | 26h – 32h | **Must Have** |
| **P6** | Speculative Drafting | Dual-drafting (Draft A/B) during answer, sub-500ms turn transitions | 32h – 36h | *24h Cut / 48h Must* |
| **P7** | Consistency Ledger | Cross-claim fact ledger, polite contradiction reconcile question | 36h – 40h | *24h Cut / 48h Must* |
| **P8** | Receipts Dossier | Post-interview audit dossier, time scrubber, synchronized clip player | 40h – 44h | **Must Have** |
| **P9** | Integrity Telemetry | Client MediaPipe saccade logging, response onset variance | 44h – 46h | *24h Cut / 48h Stretch* |
| **P10**| Hardening & Deck | Slide deck population (`BNB-IDEA-Presentation-Format.pptx`), live rehearsal | 46h – 48h | **Must Have** |

### Execution Contingency (The 24-Hour Cut Line):
If time is constrained, cut P6 (speculative drafting; fall back to fast single prompt), P7 (consistency ledger), and P9 (telemetry). The demo core: **Case ring swings mid-sentence $\to$ locks green $\to$ clickable receipt plays audio clip** remains 100% operational.
