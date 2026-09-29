# Hariharan's Deep-Dive — [03] Frontend & [04] Integrity & Audit

> **Audience:** Hariharan  
> **Location:** `docs/pitch/hariharan/03_FRONTEND_AND_INTEGRITY_GUIDE.md`  
> **Purpose:** Detailed mastery over the Next.js 16 frontend, the Interactive Time Scrubber, edge-native computer vision, and the SHA-256 cryptographic audit chain.

---

## 1. [03] Frontend & Case Board Architecture

### Why We Rejected 3D Avatars (The Design Philosophy):
* Competitors spend millions trying to build 3D talking head avatars (e.g. Apriora, Micro1).
* **The Reality:** Candidates despise talking to synthetic faces. It triggers the uncanny valley, causes social anxiety, and leads to a **54% abandonment rate**.
* Furthermore, rendering real-time WebRTC 3D video streams on cloud GPU servers costs **$0.50/minute ($7.50 per 15-minute interview)**!
* **Verity's Apple HIG Approach:** A clean, calm 2D canvas with fluid SVG belief rings and an ambient audio orb. Clean, distraction-free, and costs **10 cents per interview** (75x cheaper).

### Deterministic 2D Layout (No Force Simulation Wobble):
* Many AI apps use D3 force-directed graphs where nodes bounce and wobble constantly. On a stage projector, that looks distracting and unpolished.
* Verity uses a **deterministic 2D grid** (up to 12 cases visible), arranged cleanly so recruiters and judges can read every claim at a glance.

### The Interactive Time Scrubber (The Recruiter's Dream Feature):
```
EVIDENTIARY TIMELINE:
00:00 ─────────[●]───────────[●]───────────[●]───────────[●]──────── 18:14
               R#1           R#2           R#3           R#4
               Kafka         Redis         K8s           WebRTC
```
* **How It Works Under the Hood:** Because all state in Verity is an append-only event stream, state at any second $T$ is mathematically derived by pure functional replay:
  $$S(T) = \text{reduceAll}(\text{events}, T)$$
* **The UX Magic:** A recruiter can drag the slider back to minute 04:15. The entire 2D Case Board instantly rewinds to show the exact belief rings as they existed at that second.
* **One-Click Audio Proof:** Clicking any receipt tile plays the exact 10–12 second audio clip of that specific answer with real-time transcript karaoke highlighting.

---

## 2. [04] Integrity & Audit Architecture

### Ethical Philosophy: "Observations, Not Accusations"
* Legacy proctoring platforms (Honorlock, Proctorio, Mettl) act like invasive malware: demanding 360-degree bedroom sweeps, installing kernel drivers, and penalizing neurodivergent candidates for looking away while thinking.
* **Verity’s Non-Negotiable Rule:** **No Cheating Scores.** We never output an arbitrary "Cheating Probability: 78%".
* Instead, Verity logs **objective, timestamped timeline observations** (*"Tab unfocused for 3.2s during Kafka question"*). A human recruiter makes the final judgment.

### 100% Edge-Native Computer Vision (Zero Video Streaming):
* All vision processing runs **locally inside the candidate's browser via WebAssembly (MediaPipe FaceLandmarker)**.
* **Video frames never leave the user's laptop.** No video is stored on our servers, eliminating cloud GPU processing costs and guaranteeing complete **GDPR and IRB privacy compliance**.
* **5-Second Opt-In Calibration:** Before starting, candidates look at a center dot and four corners. If they decline or have no camera, gaze tracking is disabled and carries zero penalty.

### How We Catch AI Copilot Teleprompter Reading:
1. **The Sawtooth Saccade Waveform (Iris FFT):**
   * Natural human thinking gaze wanders erratically with high variance ($\sigma^2 > 0.45$).
   * A candidate reading text streaming off an auxiliary monitor or HUD exhibits a distinct **periodic sawtooth kinematic wave**: slow rightward drift ($1.5\text{–}2.5\text{s}$) followed by an instantaneous leftward return flick ($<80\text{ms}$).
   * Fast Fourier Transform on iris coordinates flags periodic reading frequencies ($0.4\text{–}0.8\text{ Hz}$).
2. **Cognitive Onset Latency ($CV_{\text{latency}}$):**
   * Copilots (Whisper + LLM) introduce a rigid, uniform $2.2\text{s}–3.5\text{s}$ pause before speech onset across all questions.
   * Real human pauses vary with problem difficulty ($CV = \sigma / \mu > 0.35$). Flat latency profiles flag artificial text scanning.

### Cryptographic SHA-256 Hash Chain:
Every state change is sealed into an immutable append-only hash chain:
$$\text{Hash}_n = \text{SHA-256}\Big( n \;\|\; \text{SessionID} \;\|\; \text{EventType} \;\|\; \text{Timestamp} \;\|\; \text{Payload} \;\|\; \text{Hash}_{n-1} \Big)$$
* If an unauthorized admin attempts to modify a transcript, adjust a score, or delete an observation, **the hash chain immediately breaks at that sequence number**.
* This provides ironclad proof under **NYC Local Law 144** and EEOC Title VII audits.
