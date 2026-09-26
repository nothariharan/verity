# Advanced Anti-Cheat & Authenticity Architecture: 10 Stealth Evaluation Factors

> **Hackathon Research Subpage 10: Integrity & Authenticity Deep-Dive**  
> **Domain:** AI/ML Track — AI-Powered Interview Bot  
> **Philosophy:** *Authenticity Coaching over Dystopian Surveillance.* Since SocraticHire is an interview intelligence and mock-prep platform, anti-cheat mechanisms are designed as **constructive diagnostic telemetry**—helping candidates realize when they sound scripted or teleprompted, while providing recruiters with tamper-proof authenticity verification without invasive kernel-level spyware.

---

## 1. Executive Philosophy: Why Traditional Anti-Cheat Fails

Traditional proctoring software (Honorlock, Proctorio, Mettl) uses **invasive, punitive surveillance**:
* Demanding 360-degree room scans.
* Installing kernel-level drivers (Ring-0) that access local background processes.
* Issuing immediate automated disqualifications when a candidate glances away to sketch a diagram.

This creates extreme anxiety, triggers ADA/neurodiversity discrimination lawsuits, and still gets bypassed by external hardware (HDMI splitters, auxiliary phones, invisible earpieces).

### SocraticHire's Approach: Browser-Native Behavioral Telemetry
Instead of acting like malware, SocraticHire monitors **10 behavioral, acoustic, and linguistic signals** that reveal whether a candidate is speaking authentically or reading an off-screen AI copilot (e.g. Final Round AI, LockedIn AI, Whisper desktop overlays).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    10 ADVANCED AUTHENTICITY FACTORS                         │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│ Cognitive & Visual      │ Acoustic & Environment  │ Linguistic & Behavioral │
│ Kinematics (1-3)        │ Signals (4-6)           │ Traps (7-10)            │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ 1. Reading Saccade Wave │ 4. Virtual Loopback Aud │ 7. Perplexity & Burst   │
│ 2. Cognitive Onset Lag  │ 5. Keystroke Soundprint │ 8. Mouse & Focus Drift  │
│ 3. Virtual Cam Jitter   │ 6. Dual-Voice Whisper   │ 9. Clipboard & DevTools │
│                         │                         │ 10. Socratic Honeypots  │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 2. The 10 Authenticity Factors in Detail

### 1. Reading Saccade Kinematics (Sawtooth Eye-Tracking)
* **What Competitors Miss:** Standard gaze trackers only check if the candidate looks away from the center.
* **Our Algorithmic Innovation:** MediaPipe FaceMesh tracks the horizontal iris position $x(t)$ over time. 
  * **Natural Thought Gaze:** When humans think, their eyes wander erratically or glance upward with high angular variance.
  * **Teleprompter Reading Pattern:** Reading text streaming off an auxiliary screen or overlay generates a distinct **sawtooth kinematic signature**:
    $$\frac{dx}{dt} \approx +v_{\text{read}} \quad (\text{smooth rightward drift for } 1.5\text{–}2.5\text{s}) \implies \frac{dx}{dt} \ll 0 \quad (\text{instantaneous leftward return saccade in } <80\text{ms})$$
  * **Detection:** Fast Fourier Transform (FFT) on the iris horizontal trajectory identifies periodic reading frequencies ($0.4\text{–}0.8\text{ Hz}$). If detected, logs `TELEPROMPTER_READING_PATTERN`.

---

### 2. Cognitive Response Latency vs. LLM TTFT Profiling
* **What Competitors Miss:** Assuming silence always means the candidate is thinking.
* **Our Algorithmic Innovation:** Tracking the precise delta between question completion and speech onset ($\Delta T_{\text{onset}}$).
  * **Natural Human Speech:** Easy questions have short latencies ($0.4\text{s}–1.0\text{s}$); complex architectural questions have long, variable pauses ($2.0\text{s}–5.0\text{s}$) often accompanied by natural verbal fillers (*"Well, that depends on..."*).
  * **AI Copilot Signature:** Candidates reading from a copilot display an unnervingly consistent **1.8s to 3.2s dead-silence gap** across *all* questions (the exact time needed for Audio Capture $\to$ Whisper STT $\to$ LLM TTFT $\to$ Candidate scanning the first sentence).
  * **Metric:** Coefficient of Variation of Response Latency:
    $$CV_{\text{latency}} = \frac{\sigma_{\text{latency}}}{\mu_{\text{latency}}}$$
    If $CV_{\text{latency}} < 0.15$ with a mean latency of $\sim 2.5\text{s}$, logs `ARTIFICIAL_RESPONSE_LATENCY_DETECTED`.

---

### 3. Virtual Camera & Video Stream Tampering Detection
* **What Competitors Miss:** Candidates using OBS Virtual Camera, ManyCam, or pre-recorded looping video feeds with deepfake lip-sync tools (Simli / Wav2Lip).
* **Our Algorithmic Innovation:**
  * In the browser, inspects `MediaStreamTrack.getSettings()` and `getCapabilities()`.
  * Checks device label and driver signatures against blacklisted virtual camera drivers (`OBS Virtual Camera`, `v4l2loopback`, `ManyCam`, `CamTwist`).
  * Measures **Frame Timestamp Jitter**: Virtual cameras feeding pre-rendered frames show zero micro-jitter compared to physical USB webcams that exhibit natural CMOS sensor exposure fluctuations.
  * Static background luminance analysis: Checks if background illumination flickers in sync with computer screen reflections.

---

### 4. Virtual Audio Loopback & Routing Driver Interception
* **What Competitors Miss:** Candidates routing interview audio into local desktop Whisper copilots using virtual audio cables (VB-Cable, BlackHole, VoiceMeeter).
* **Our Algorithmic Innovation:**
  * Web Audio API queries `navigator.mediaDevices.enumerateDevices()`.
  * Flags virtual audio sink drivers (`CABLE Output`, `BlackHole 2ch`, `VoiceMeeter VAIO`).
  * Measures **Audio Clock Phase Drift**: Virtual audio cables running across software buffers exhibit clock drift and buffer re-sampling artifacts that differ from direct ALSA/CoreAudio/WASAPI hardware inputs.

---

### 5. Acoustic Keystroke Soundprinting (Typing While Listening)
* **What Competitors Miss:** Candidates frantically typing the interviewer's question into ChatGPT on a muted second laptop or mechanical keyboard.
* **Our Algorithmic Innovation:**
  * While the bot is speaking or immediately after it asks a question, an audio analyzer node runs a high-frequency transient detector ($2.5\text{kHz}–6.0\text{kHz}$).
  * Distinguishes high-peaked impulsive transient sounds (mechanical switch click / membrane key clatter) from ambient background hum.
  * If keystrokes are detected while the candidate is supposedly not writing on a shared whiteboard, logs `CONCURRENT_KEYBOARD_PROMPTING`.

---

### 6. Spectral Audio Overlap & Whisper Diarization
* **What Competitors Miss:** An off-camera friend or coach whispering answers to the candidate from behind the laptop screen.
* **Our Algorithmic Innovation:**
  * Web Audio API processes microphone audio through a dual-bandpass filter (Formant tracking).
  * Computes Spectral Flatness and Harmonic-to-Noise Ratio (HNR).
  * Normal speech has clear harmonic formants ($F_1, F_2$); whispers lack fundamental vocal fold vibration ($F_0$) and appear as colored broadband noise in the $1.5\text{kHz}–4.0\text{kHz}$ band.
  * If whisper signatures co-occur with or precede candidate speech, logs `OFF_CAMERA_WHISPER_COACHING`.

---

### 7. Linguistic Perplexity, Burstiness & Token Entropy
* **What Competitors Miss:** Assessing what the candidate said without analyzing *how language models write*.
* **Our Algorithmic Innovation:**
  * Natural human speech is characterized by **high burstiness** (erratic sentence lengths, grammatical self-corrections, colloquial connectives, and hesitations).
  * AI-generated text (ChatGPT/Claude) exhibits **low perplexity and uniform sentence length distributions**.
  * A lightweight client/server transformer calculates the running token entropy of candidate transcripts:
    $$B = \frac{\sigma_{\text{sentence\_length}} - \mu_{\text{sentence\_length}}}{\sigma_{\text{sentence\_length}} + \mu_{\text{sentence\_length}}}$$
  * A candidate reading polished paragraphs with zero filler words and flat burstiness ($B < -0.3$) receives an `ACADEMIC_PROSE_READING_ANOMALY` tag.

---

### 8. Mouse Cursor Trajectory & Off-Screen Focus Drift
* **What Competitors Miss:** Even if the candidate doesn't switch tabs (`blur`), their cursor is actively moving on a second monitor to highlight text or scroll an LLM output.
* **Our Algorithmic Innovation:**
  * Global `mousemove` listener on the browser window.
  * Tracks cursor exit coordinates and exit velocity vectors.
  * If the mouse continuously leaves the window toward the right edge at the exact moment a question is asked, and returns right before speaking begins, logs `CROSS_MONITOR_INTERACTION_CYCLE`.

---

### 9. Clipboard Interception & DevTools Integrity Hooks
* **What Competitors Miss:** Candidates copying technical questions and pasting them into AI chatbots.
* **Our Algorithmic Innovation:**
  * Intercepts `copy`, `paste`, `cut`, and right-click context menu events (`event.preventDefault()` or silent logging).
  * **DevTools Open Detection:** Checks timing divergence between `console.log` object evaluations and microtask queues, or detects viewport size differentials:
    $$\Delta W = \text{window.outerWidth} - \text{window.innerWidth} > 160\text{px} \implies \text{Docked DevTools Opened}$$
  * Disables selection of code prompts while logging any inspection attempts.

---

### 10. Algorithmic Socratic Honeypots (Counterfactual Traps)
* **What Competitors Miss:** Relying entirely on software detectors rather than conversational intelligence.
* **Our Algorithmic Innovation:**
  * The planner deliberately introduces a subtle, non-existent parameter or altered constraint into a follow-up question:
    > *"In Python 3.12's new immortal objects implementation, how did you handle reference cycle leaks on frozen dicts?"*
  * **The AI Copilot Trap:** A generic LLM copilot reads the prompt literally and hallucinates a convincing, technical-sounding explanation of how to handle frozen dict reference cycles on immortal objects.
  * **The Authentic Human Reaction:** A genuine Python engineer stops and says: *"Wait, immortal objects don't participate in reference counting cycles because their refcount is fixed at compile-time—and frozen dicts aren't a built-in type yet unless you use an external PEP library."*
  * **Outcome:** The honeypot immediately catches candidates who blindly recite whatever appears on their screen.

---

## 3. How This Enhances the Mock Interview Learning Experience

Because SocraticHire is an empowering **interview practice platform**, these 10 factors are framed as **"Authenticity Coaching Insights"** rather than punitive cheating flags:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CANDIDATE AUTHENTICITY COACH REPORT                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [💡 Feedback for Candidate Growth]                                         │
│                                                                             │
│  • Speech Prosody & Delivery:                                               │
│    "Your answer on Kafka architecture sounded slightly rehearsed or read.   │
│     Try explaining technical decisions with more conversational cadence and │
│     fewer textbook paragraphs. Interviewers want your personal experience." │
│                                                                             │
│  • Eye Contact & Engagement:                                                │
│    "We noticed periodic horizontal gaze sweeps during question 3. Practice   │
│     looking closer to your camera lens to build stronger visual rapport."   │
│                                                                             │
│  • Trade-off Depth:                                                         │
│    "You caught the subtle nuance in the distributed consensus question.     │
│     Excellent instinctive debugging explanation!"                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. UI / UX Design System References (From User Inspiration)

To make SocraticHire look like an elite 2026 AI-native developer tool, we integrate design principles from the curated UI libraries:

1. **ObsidianUI & Things (Neobrutalism & Dark Slate Architecture):**
   * High-contrast dark theme: Background `#090D16`, cards `#111726`, border `rgba(255,255,255,0.08)`.
   * Monospace code accents, subtle badges, and crisp typography.
2. **Amicro & Microkit (Micro-Interactions):**
   * Magnetic buttons with interactive hover glares for starting/stopping the interview.
   * Smooth animated pulse states when the bot is in `LISTEN` vs `SPEAK` vs `BACKCHANNEL`.
3. **Canvas UI & React Bits (Shader Audio Waveforms):**
   * Real-time WebGL/Shader fluid orb or neural waveform visualizer that reacts to the candidate's actual voice pitch and amplitude.
4. **21st.dev / Shadcn / Kokonut UI:**
   * Clean popovers, drawer panels for the Knowledge Graph, and accessible score sliders.

---

## 5. Summary Table: 10 Factors Integration into SocraticHire

| # | Factor Name | Detection Method | Server GPU Cost | Candidate Coaching Value | Recruiter Value |
| :-: | :--- | :--- | :---: | :--- | :--- |
| **1** | **Reading Saccade Kinematics** | MediaPipe iris FFT ($x(t)$ sawtooth) | **$0.00** (Edge WASM) | Identifies reading off teleprompters | Flags cheat overlays |
| **2** | **Cognitive Onset Latency** | Speech onset delta ($CV_{\text{latency}}$) | **$0.00** (Local clock) | Teaches natural answering pace | Flags 2.5s copilot lag |
| **3** | **Virtual Camera Tampering** | `MediaStreamTrack` driver checks | **$0.00** (Browser API) | Reassures camera readiness | Prevents video loop deepfakes |
| **4** | **Virtual Audio Cable Routing** | `enumerateDevices` sink check | **$0.00** (Browser API) | Verifies clear mic hardware | Blocks desktop audio capture |
| **5** | **Acoustic Keystroke Fingerprint** | Web Audio transient filter | **$0.00** (Web Audio API)| Reminds to focus on speech | Flags background ChatGPT prompts |
| **6** | **Spectral Whisper Detection** | Formant broadband noise ($F_0$ drop) | **$0.00** (Web Audio API)| Alerts on noisy room environment | Flags in-room coaching |
| **7** | **Linguistic Perplexity / Burst** | Running token entropy on transcript | Low (Server regex/LLM) | Teaches authentic storytelling | Catches AI-generated text |
| **8** | **Mouse & Focus Drift** | Window boundary vector listeners | **$0.00** (DOM listener) | Encourages screen presence | Flags secondary monitor use |
| **9** | **Clipboard & DevTools Hooks** | DOM event listeners & timing checks| **$0.00** (DOM listener) | Keeps practice hands-on | Blocks copy-pasting |
| **10**| **Socratic Honeypot Probes** | Non-standard parameter follow-ups | Low (Planner prompt) | Tests genuine conceptual depth | Instantly exposes LLM parrot |
