# Current Tech Stacks & Architectural Failure Modes in AI Interview Bots

> **Hackathon Research Subpage 03**  
> **Domain:** AI/ML Track — AI-Powered Interview Bot  
> **Target:** Deep technical autopsy of existing platforms, cloud stacks, latency bottlenecks, and proctoring pitfalls.

---

## 1. Technical Deconstruction of Existing Products

Modern interview platforms deploy three prevalent architectural paradigms. Each comes with significant trade-offs and structural vulnerabilities:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXISTING ARCHITECTURAL PARADIGMS                         │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│ Architecture A:         │ Architecture B:         │ Architecture C:         │
│ Legacy Async Video      │ Avatar-Based Cascaded   │ Server-Heavy Proctoring │
│ (HireVue, Willo)        │ Real-Time (Apriora)     │ (Mettl, ProctorU)       │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • Browser MediaRecorder │ • WebRTC audio/video    │ • Continuous RTSP /     │
│ • S3 upload via presign │ • STT (Deepgram/Whisper)│   WebRTC video stream   │
│ • Offline Batch NLP /   │ • LLM (GPT-4o)          │ • Heavy GPU cloud nodes │
│   sentiment scoring     │ • TTS (ElevenLabs)      │   (AWS g4dn / g5)       │
│ • Static timer UI       │ • Avatar (HeyGen/Tavus) │ • Aggressive auto-ban   │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 2. The 5 Fatal Failure Modes of Current Tech Stacks

### 2.1 The "Cascaded Pipeline Latency Trap" (The 2.5-Second Death Spiral)
* **The Root Cause:** Most conversational AI bots chain separate cloud services:
  $$\text{Latency} = T_{\text{VAD}} + T_{\text{STT}} + T_{\text{LLM-TTFT}} + T_{\text{TTS}} + T_{\text{AvatarGen}} + T_{\text{NetworkBuffer}}$$
* **Breakdown in Practice:**
  1. Client Voice Activity Detection (VAD) pause threshold: **300ms – 500ms**
  2. Speech-to-Text (STT) transcription: **200ms – 400ms**
  3. LLM Time to First Token (TTFT): **300ms – 800ms**
  4. Text-to-Speech (TTS) audio synthesis: **250ms – 500ms**
  5. Video Avatar Lip-Sync Rendering (HeyGen / Simli / Tavus): **600ms – 1200ms**
  * **Total Response Delay: 1.65s to 3.4 seconds.**
* **Why It Breaks:** Human conversational turn-taking occurs in **200ms – 400ms**. When an interview bot takes 2.5+ seconds to answer, candidates think the bot didn't hear them and start speaking again just as the bot begins talking. This results in jarring audio collisions, broken turn-taking, and extreme conversational fatigue.
* **The Uncanny Valley of Avatars:** Candidates overwhelmingly report that synthetic 3D/video avatars look robotic and creepy. The visual lag between audio and lip movement worsens the experience.

---

### 2.2 The Unit Economics & Server GPU Bandwidth Wall
* **The Root Cause:** Transmitting continuous 720p/1080p candidate webcam video to AWS/GCP GPU servers for real-time OpenCV / YOLO / gaze analysis creates unsustainable infrastructure costs:
  * Ingesting 1,000 simultaneous candidate video streams at 2.5 Mbps consumes **2.5 Gbps continuous bandwidth**.
  * Running GPU instances (e.g. AWS `g5.xlarge` with NVIDIA A10G at ~$1.00/hour) for every 2-4 concurrent interviews pushes compute costs to **$0.30 – $0.50 per minute of interview**.
* **Why Competitors Fail:** This heavy cost structure forces SaaS vendors to charge high per-seat or per-interview fees ($25 to $100 per candidate), pricing out startups, mid-market businesses, and universities.

---

### 2.3 Pseudoscience & Algorithmic Bias in Facial Emotion Analysis
* **The Trap:** Legacy tools attempted to use facial action coding (FACS) to estimate "confidence", "enthusiasm", and "honesty" from eyebrow twitches and smile frequency.
* **Why It Collapsed:**
  * Peer-reviewed cognitive science has repeatedly demonstrated that facial expressions vary across cultures, ethnicities, and neurotypes (e.g., individuals on the autism spectrum or with ADHD).
  * Led to massive regulatory backlashes: FTC enforcement, NYC Local Law 144, and the EU AI Act classifying emotion recognition in employment as an unacceptably high-risk or prohibited practice.
* **Our Corrective Architecture:** **Never score emotional expression.** Only track objective, verifiable attention telemetry (screen focus, dual faces, tab switches) and keep the hiring score strictly grounded in technical rubrics and communication content.

---

### 2.4 The Proctoring False-Positive Nightmare
* **The Problem:** Current anti-cheat algorithms use crude binary thresholds:
  * "If candidate eye coordinates drift away from center $(x, y)$ for $>500\text{ms} \rightarrow \text{FLAG CHEAT}$."
* **Why This Destroys the Process:**
  * When humans engage in complex cognitive synthesis (e.g. designing a database schema or recalling an algorithm), the natural physiological response is to **look up or look away** (known in cognitive psychology as *gaze aversion*).
  * Candidates writing notes on paper or whiteboards are immediately flagged as "looking at a second device."
  * Candidates wearing thick glasses suffer from lens glare that throws off basic iris trackers.
* **How to Fix It:** Implement **temporal debouncing ($\ge 2.0\text{s}$ threshold)**, multi-frame pose consensus (combining head yaw with iris coordinates), and present the data as an **interactive timeline for recruiter review**, never an automated rejection flag.

---

### 2.5 LLM Evaluation Hallucination & Sycophancy
* **The Problem:** Generic LLMs prompted with *"Evaluate this candidate's interview answer"* suffer from two severe evaluation flaws:
  1. **Sycophantic Grade Inflation:** LLMs tend to be agreeable and grade almost all coherent-sounding answers between 7.5 and 9 out of 10.
  2. **Buzzword Vulnerability:** If a candidate recites high-level buzzwords (*"Kubernetes, distributed Kafka partition leader election, Raft consensus, idempotency"*), generic prompts reward them with high scores, even if the candidate never explained the actual implementation logic.
* **The Architectural Fix:** **Structured Multi-Rubric Extraction with Negative Claim Verification.** The LLM evaluator must compare candidate transcripts against explicit, deterministic rubric anchors (Junior vs Mid vs Senior response benchmarks) and check whether the candidate answered the exact probing question or dodged it.

---

## 3. Comparison: Legacy Stack vs. Our Optimized Hackathon Stack

| Component | Legacy Competitor Approach | Our BNB Hackathon Architecture | Why Ours Wins |
| :--- | :--- | :--- | :--- |
| **Voice Streaming** | HTTP Chunked Audio / REST calls ($\sim 1800\text{ms}$) | **Native WebSockets / Full-Duplex PCM (<600ms)** | Instantaneous conversational turn-taking. |
| **Visual Avatar** | Heavy Video Avatar (HeyGen / Tavus) with uncanny lag | **Clean Waveform / Audio-Reactive Minimalist HUD** | Zero lip-sync lag, zero uncanny valley, 100% focus on dialogue. |
| **Integrity / Proctoring** | Server-side GPU Video Stream ($0.50/min) | **Browser-Side MediaPipe WASM/WebGL ($0 server compute)** | 100% candidate privacy (video never leaves device), zero server GPU costs. |
| **Adaptive Probing** | Static list of 5 fixed questions | **LangGraph-style Dynamic State Probing Engine** | Probes deeper on verified resume claims; catches teleprompter readers. |
| **Scoring Engine** | Black-box single numeric score ("67%") | **Dual-Sided Explainable Rubrics & Candidate Growth Dossier** | Actionable coaching for candidates; defensible audit trails for recruiters. |

---

## 4. Key Takeaways for Technical Feasibility & Innovation

1. **Edge-Native Computer Vision is the Ultimate Hack:** By moving MediaPipe FaceLandmarker directly into the browser client via WASM, we achieve 30 FPS gaze and head pose tracking with **zero cloud GPU infrastructure costs**, total candidate data privacy, and zero video bandwidth overhead.
2. **Sub-600ms Voice is the "Wow" Factor:** Eliminating heavy video avatar rendering cuts latency by 60%, delivering an interview experience that feels like a real, natural phone call with an elite human recruiter.
3. **Adaptive Probing Neutralizes AI Teleprompters:** The only way to defeat candidates using Final Round AI or ChatGPT overlays is **unscripted, dynamic follow-up questions** that drill into specific resume project nuances where static cheat-sheets fail.
