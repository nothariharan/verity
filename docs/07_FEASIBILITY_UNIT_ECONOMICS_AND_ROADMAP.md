# 07 — Technical Feasibility, Unit Economics & 48-Hour Execution Roadmap

> **Target Platform:** Verity (formerly SocraticHire)  
> **Hackathon Track:** AI/ML Track — Problem Statement: AI-Powered Interview Bot  
> **Financial Benchmark:** 50x–75x Cost Advantage Over 3D Avatar Bots  
> **Source Document:** Curated for NotebookLM Ingestion & Business Feasibility Analysis

---

## 1. Technical Feasibility: Proven Primitives, Zero R&D Fog

A critical failure mode of ambitious hackathon projects is betting on unproven research models or unreleased speech-to-speech APIs. 

Verity achieves world-class conversational performance by orchestrating **mature, enterprise-grade APIs** through an innovative state machine:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VERITY PRODUCTION TECHNOLOGY STACK                       │
├─────────────────────┬──────────────────────────┬────────────────────────────┤
│ Component           │ Production Provider      │ Deterministic Local Fake   │
├─────────────────────┼──────────────────────────┼────────────────────────────┤
│ Streaming STT       │ Deepgram Flux / Nova-2   │ Scripted Transcript Replay │
│ Low-Latency TTS     │ ElevenLabs Flash v2.5    │ Pre-recorded WAV Chunks    │
│ Fast LLM Reasoning  │ Groq / Llama-3.3-70B     │ Static Prompt Fixtures     │
│ Edge Vision (Gaze)  │ MediaPipe FaceLandmarker │ Simulated Iris Coordinates │
│ Core Runtime        │ Next.js 16 + Fastify WS  │ Standalone Node.js Runner  │
│ Database / Log      │ libSQL / SQLite (Drizzle)│ In-Memory Array Chain      │
└─────────────────────┴──────────────────────────┴────────────────────────────┘
```

* **No Expensive Custom Model Training:** Zero time wasted fine-tuning unstable base models.
* **Deterministic Offline Mode (`PROVIDERS=fake`):** The entire application can be launched, tested, and demoed on an airplane with zero internet connection and zero API keys.

---

## 2. Unit Economics: The 50x Cost Advantage

Competitors running 3D animated avatars (Apriora, Micro1) require dedicated cloud GPUs (NVIDIA A10G / H100) to render real-time WebRTC video streams. This creates an unsustainable cost barrier:

$$\text{Avatar Bot Cost} \approx \$0.35\text{ to }\$0.60 \text{ per minute} \implies \mathbf{\$5.25\text{ to }\$9.00 \text{ per 15-minute interview}}$$

### Verity’s Edge-Native API Cost Breakdown (15-Minute Technical Interview):

| Component | Usage Volume in 15-Min Call | Rate | Cost per Interview |
| :--- | :--- | :--- | :--- |
| **Deepgram Streaming STT** | 15 minutes of streaming audio | $0.0043 / min | **$0.0645** |
| **ElevenLabs Flash v2.5 TTS**| ~1,600 characters of bot speech | $0.010 / 1k chars | **$0.0160** |
| **Groq / Llama-3.3-70B Inference**| ~25k tokens (Extractor + Drafter) | $0.0006 / 1k tokens| **$0.0150** |
| **MediaPipe Edge Vision** | 15 minutes of webcam telemetry | Local Client CPU/WASM | **$0.0000** |
| **Server WebSocket Egress** | ~12 MB binary audio | Cloudflare / Fastify | **$0.0002** |
| **TOTAL VERITY COST** | **15-Minute Rigorous Investigation** | — | **$0.0957 (~$0.10)** |

```
COST PER 15-MINUTE INTERVIEW:
┌────────────────────────────────────────────────────────┐
│ Competitors (Micro1/Apriora): $7.50 [████████████████] │
│ Verity:                       $0.10 [▍]                │
└────────────────────────────────────────────────────────┘
  ──► 75x Cheaper per Screening Session!
```

### Business Impact:
* An enterprise screening **10,000 university applicants** spends **$75,000** with avatar bots.
* With Verity, the same campaign costs **$957**, making automated, high-fidelity technical screening accessible to every company on Earth.

---

## 3. Operational Feasibility: Zero-Friction Web Experience

* **Zero Candidate Installation:** Runs entirely inside standard web browsers (Google Chrome, Safari, Edge, Firefox). No software to download, no browser extensions, no kernel drivers.
* **Instant Recruiter Hand-off:** Integrates with standard Applicant Tracking Systems (Greenhouse, Lever, Ashby) via webhook event export.
* **Enterprise Security & Compliance:** SOC2-ready architecture, encrypted WebSockets (WSS), zero cloud video storage, and cryptographic SHA-256 hash chains.

---

## 4. 48-Hour Hackathon Execution Roadmap & Cut Lines

```
H00 ────────── H12 ────────── H24 ────────── H36 ────────── H48
 │ Monorepo + Zod │ Case Board  │ Duplex Loop │ Dossier +  │ Rehearsal &
 │ Event Log      │ Text Mode   │ Barge-In    │ Telemetry  │ Deck Prep
 └────────────────┴─────────────┴─────────────┴────────────┴─────────────►
```

| Phase | Milestone | Deliverable | Status |
| :--- | :--- | :--- | :--- |
| **P0: Foundations** | Hour 0–4 | Monorepo, Zod contracts, hash-chained log, Fakes, CI | Must Have |
| **P1: Case Engine** | Hour 4–10 | Resume extractor, 3-hypothesis updater, typed mode | Must Have |
| **P2: Case Board UI** | Hour 10–16 | Next.js 2D case board, fluid belief rings, receipts feed | Must Have |
| **P3: Listening Loop**| Hour 16–22 | Deepgram streaming STT, live provisional belief updates | Must Have |
| **P4: Speaking Loop** | Hour 22–26 | ElevenLabs Flash v2.5 TTS, audio worklet player | Must Have |
| **P5: Duplex Control**| Hour 26–32 | Smart barge-in (<120ms flush), 4-state FSM, backchannels | Must Have |
| **P6: Spec Drafting** | Hour 32–36 | Dual-drafting (Draft A/B) during answer, <600ms latency | 24h Cut / 48h Must |
| **P7: Ledger** | Hour 36–40 | Fact ledger, polite contradiction reconcile question | 24h Cut / 48h Must |
| **P8: Dossier** | Hour 40–44 | Post-interview dossier, time scrubber, audio playback | Must Have |
| **P9: Telemetry** | Hour 44–46 | MediaPipe iris saccades, response latency $CV$ | 24h Cut / 48h Stretch |
| **P10: Hardening** | Hour 46–48 | Slide deck (`BNB-IDEA-Presentation-Format.pptx`), rehearsal | Must Have |

### The Emergency 24-Hour Cut Line:
If hackathon constraints limit development time, cut P6, P7, and P9. The core demo—**Belief ring swings mid-sentence $\to$ locks green $\to$ clicking receipt plays exact audio clip**—remains 100% operational.
