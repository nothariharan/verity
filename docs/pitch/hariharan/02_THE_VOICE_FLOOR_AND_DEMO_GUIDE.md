# Hariharan's Deep-Dive — [02] The Voice Floor & Demo Operations

> **Audience:** Hariharan  
> **Location:** `docs/pitch/hariharan/02_THE_VOICE_FLOOR_AND_DEMO_GUIDE.md`  
> **Purpose:** Complete operational and architectural mastery over the audio pipeline, conversational latency, and running a glitch-free live stage demo.

---

## 1. The 4-State Duplex Voice Floor (In Plain English)

Why do almost all AI voice bots feel robotic, clumsy, and unnatural?
* They either talk over the user because they can't handle interruptions, OR
* They pause for 2.5 to 3.0 seconds after the user stops speaking, creating painful dead air.

Verity solves this with a formal **4-State Voice Floor**:

```
                       ┌──────────────────────────────┐
                       │            LISTEN            │◄─────────────────────────┐
                       │ • Mic open; streams 16kHz PCM│                          │
                       │ • Provisional ring shifts    │                          │
                       └──────────────┬───────────────┘                          │
                                      │                                          │
            Short pause on connective │  Candidate finishes                      │
            conjunction ("and... uh") │  speaking (STT boundary)                 │
                                      ▼                                          │
                       ┌──────────────────────────────┐                          │
                       │         BACKCHANNEL          │                          │
                       │ • Play local browser: "mhm"  │                          │
                       │ • $0.00 cost | 0ms latency   │                          │
                       └──────────────┬───────────────┘                          │
                                      │                                          │
                                      ▼                                          │
                       ┌──────────────────────────────┐                          │
                       │            SPEAK             │                          │
                       │ • Plays pre-drafted question │                          │
                       │ • Streams ElevenLabs audio   │                          │
                       └──────────────┬───────────────┘                          │
                                      │                                          │
      Candidate interrupts mid-bot    │                                          │ Bot finishes
      (VAD energy > 80ms)             │                                          │ question
                                      ▼                                          │
                       ┌──────────────────────────────┐                          │
                       │            YIELD             │                          │
                       │ • Instant buffer flush <20ms │──────────────────────────┘
                       │ • Server aborts TTS stream   │
                       └──────────────────────────────┘
```

### The 4 States Explained:
1. **`LISTEN`:** The candidate talks. Raw audio is sliced into 100ms PCM frames. As words arrive, our heuristic classifier shifts the belief ring *provisionally* (with a dashed stroke).
2. **`BACKCHANNEL`:** If the candidate pauses for 400ms on a connective word (*"because... uh..."*), Verity plays a subtle on-device audio clip (*"right"*, *"got it"*, *"mhm"*) directly from browser memory. It lets the candidate know Verity is listening without stealing their turn.
3. **`SPEAK`:** The candidate finishes. The pre-drafted question is committed to the event log in 0ms, and audio streams instantly from our pre-warmed ElevenLabs Flash v2.5 connection (<220ms first-chunk).
4. **`YIELD` (Smart Barge-In):** If the candidate talks while Verity is speaking, our browser AudioWorklet cuts playback gain to zero in under 20ms and flushes the buffer. Verity yields the floor immediately like a polite human.

---

## 2. Why We Can Guarantee Sub-600ms Latency

If a judge asks: *"How can an LLM generate a question in under 600ms?"*
* **The Answer:** *"The LLM didn't generate the question after the candidate stopped. It generated it **while** the candidate was talking."*
* While the candidate is answering Question 1, our background drafter speculatively pre-drafts **Draft A** (if they prove ownership) and **Draft B** (if they are vague).
* When the candidate stops, we select the branch in **0 milliseconds**. The only latency is ElevenLabs delivering audio bytes over an open WebSocket.

---

## 3. The Stage Demo Operational Checklist

Running a live voice demo on a hackathon stage has real-world physical risks. Follow this battle-tested checklist:

### A. Pre-Stage Audio Setup (10 Minutes Before Pitch):
* [ ] **Use a Dedicated Microphone:** Never use your laptop's built-in mic. Use a clean directional USB mic, a lapel mic, or AirPods. Built-in laptop mics pick up room reverb and trigger false barge-ins.
* [ ] **Verify Server Health:** Open browser tab to `http://localhost:8787/health`. Confirm `{ ok: true }`.
* [ ] **Audio Worklet Buffer:** Test speaking one test sentence before walking on stage to ensure browser audio permissions are granted.

### B. The Wi-Fi / Stage Emergency Plan:
* **Plan A (Live API Streaming):** Runs live with Deepgram STT, Gemini LLM, and ElevenLabs Flash TTS over Wi-Fi/Hotspot.
* **Plan B (Deterministic Offline Fallback — `PROVIDERS=fake`):**  
  If the venue Wi-Fi drops completely, don't panic. Our backend runs on deterministic local Fakes with zero cloud dependency. The entire Case Board, SVG rings, and UI work 100% offline.
* **Plan C (Text Mode Fallback):**  
  If the stage PA speakers produce extreme screeching feedback into your mic, switch seamlessly to typing into the transcript input box. Say: *"Verity evaluates text transcripts, so candidates can speak or type interchangeably."* That turns a potential technical failure into an impressive accessibility feature!
