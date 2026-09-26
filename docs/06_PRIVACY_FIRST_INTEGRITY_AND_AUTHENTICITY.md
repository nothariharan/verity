# 06 — Privacy-First Integrity, Authenticity & Ethical Diagnostics

> **Target Platform:** Verity (formerly SocraticHire)  
> **Hackathon Track:** AI/ML Track — Problem Statement: AI-Powered Interview Bot  
> **Guiding Principle:** *Authenticity Coaching over Dystopian Surveillance.*  
> **Source Document:** Curated for NotebookLM Ingestion & Ethical Integrity Design

---

## 1. The Ethical Crisis in AI Proctoring

Legacy proctoring platforms (Honorlock, Proctorio, Mettl) have turned remote interviewing into a hostile interrogation:
* Demanding invasive 360-degree bedroom webcam sweeps.
* Requiring kernel-level (Ring-0) drivers that spy on local OS background tasks.
* Disqualifying neurodivergent candidates for looking away from the screen while thinking.
* Analyzing facial emotions and micro-expressions—a practice condemned by the FTC and civil rights organizations as junk science.

### Verity's Non-Negotiable Invariants:
1. **No Cheating Scores or Fraud Probabilities:** Verity will **never** output a "Cheating Probability: 78%" or an automated disqualification flag.
2. **Neutral Observation Copy:** All telemetry is logged as neutral, objective facts (e.g. *"Window unfocused for 3.2s during Kafka question"*), never accusations (e.g. *"Suspicious behavior detected"*).
3. **Copy Lint Protection:** Automated regression tests grep all UI copy for banned words (`cheat`, `suspicious`, `fraud`, `flagged`, `score`). If any appear, the build fails.
4. **100% On-Device Computer Vision:** Video frames **never leave the user's browser**. All vision inference runs locally in WebAssembly via MediaPipe FaceLandmarker.

---

## 2. The 10 Advanced Authenticity Signals

Rather than behaving like invasive malware, Verity observes **10 subtle behavioral, acoustic, and linguistic signals** to differentiate genuine technical recall from off-screen LLM teleprompter reading:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    10 ADVANCED AUTHENTICITY FACTORS                         │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│ Cognitive & Visual      │ Acoustic & Environment  │ Linguistic & Behavioral │
│ Kinematics              │ Signals                 │ Traps                   │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ 1. Reading Saccade Wave │ 4. Virtual Loopback Aud │ 7. Perplexity & Burst   │
│ 2. Cognitive Onset Lag  │ 5. Keystroke Soundprint │ 8. Mouse & Focus Drift  │
│ 3. Virtual Cam Jitter   │ 6. Dual-Voice Whisper   │ 9. Clipboard & DevTools │
│                         │                         │ 10. Socratic Honeypots  │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### 1. Reading Saccade Kinematics (Iris Waveform FFT)
* **The Physics:** Natural human thought involves irregular, erratic eye movements ($\sigma^2 > 0.45$) or looking upward into space.
* **The Copilot Signature:** A candidate reading text off an auxiliary screen or floating HUD exhibits a distinct **periodic sawtooth kinematic wave**:
  * Smooth rightward drift ($1.5\text{–}2.5\text{s}$) as the candidate scans the sentence.
  * Instantaneous $<80\text{ms}$ return saccade flicking left to start the next line.
* **Detection:** Fast Fourier Transform (FFT) on horizontal iris coordinates detects periodic reading frequencies ($0.4\text{–}0.8\text{ Hz}$).

### 2. Cognitive Response Latency vs. LLM TTFT Profiling ($\Delta T_{\text{onset}}$)
* **The Physics:** Humans have variable pause times. Simple questions prompt rapid answers ($0.5\text{s}$); complex architecture questions prompt long pauses ($2.0\text{–}4.0\text{s}$) accompanied by natural fillers (*"Well, it depends on..."*).
* **The Copilot Signature:** Candidates reading an LLM copilot display an unnervingly uniform **$2.2\text{s}–3.5\text{s}$ dead-silence gap** across *all* questions (Audio capture $\to$ Whisper STT $\to$ LLM TTFT $\to$ Candidate reading first word).
* **Metric:** Coefficient of Variation of Latency:
  $$CV_{\text{latency}} = \frac{\sigma_{\text{latency}}}{\mu_{\text{latency}}}$$
  If $CV_{\text{latency}} < 0.15$ with a flat $2.5\text{s}$ pause, Verity logs a `SILENCE_THEN_FLUENT` timing observation.

### 3. Virtual Camera & Synthetic Video Detection
* Detects virtual webcam drivers (OBS Virtual Cam, ManyCam) and frame duplication artifacts indicative of synthetic deepfake video loops.

### 4. Virtual Audio Loopback Detection
* Identifies virtual audio routing cables (VB-Cable, BlackHole) used to pipe candidate microphone audio into background AI transcribers.

### 5. Acoustic Keystroke Soundprints
* Web Audio high-pass filters detect rhythmic background mechanical keyboard clicking while the bot is speaking (indicating the candidate is actively prompting ChatGPT).

### 6. Acoustic Diarization & Whisper Detection (`SECOND_VOICE_POSSIBLE`)
* Deepgram streaming diarization monitors for secondary voices or whispered coaching in the room lasting $\ge 2.0\text{s}$ (with acoustic echo-guarding against Verity's own output).

### 7. Linguistic Perplexity & Token Burstiness
* Human speech is bursty, colloquial, and syntactically imperfect. LLM-generated answers display smooth, high-probability token progressions and generic transition phrases (*"Furthermore, it is important to consider..."*).

### 8. Tab Focus & Window State (`FOCUS_LOST` / `FOCUS_RETURNED`)
* Emits a neutral timeline marker if the interview tab is blurred or minimized for $\ge 1.5\text{s}$, attaching the current question sequence.

### 9. Honeypot Prompts & Clipboard Traps
* Monitors hidden text selection or clipboard copy events during technical prompts.

### 10. Socratic Mechanism Honeypots (The Ultimate Deterrent)
* Rather than asking standard textbook questions, Verity dynamically injects unexpected constraint shifts:
  * *"Suppose your write throughput quadrupled, but your Redis cluster hit a 100% memory ceiling. What specific eviction policy did you choose, and why did LRU fail?"*
* Real-time AI copilots fail because they cannot infer private, unindexed architecture details without long prompting delays.

---

## 3. Neurodiversity & Inclusion Safeguards

To prevent bias against neurodivergent candidates (e.g. ADHD, Autism Spectrum) who naturally avoid eye contact or look around while speaking:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CALIBRATION & SAFEGUARDS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. 5-Second Opt-In Calibration:                                             │
│    Candidate looks at center dot, then four corners. No calibration ──►     │
│    Gaze tracking is completely disabled.                                    │
│                                                                             │
│ 2. High Debounce Thresholds:                                                │
│    Glancing away while thinking must persist for > 3.0s with zero speech    │
│    before any observation is recorded.                                      │
│                                                                             │
│ 3. Camera is Completely Optional:                                           │
│    Candidates can conduct the interview with camera off. The interview     │
│    evaluates text transcripts, not video.                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```
