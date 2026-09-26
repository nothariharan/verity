# 03 — Live Pitch Script & Stage Choreography (Minute-by-Minute)

> **Audience:** The 3-Person Pitch Team  
> **Location:** `docs/pitch/03_LIVE_PITCH_SCRIPT_AND_STAGE_CHOREOGRAPHY.md`  
> **Total Time:** Exactly 4 Minutes (240 Seconds)  
> **Tone:** Apple Keynote — Minimalist, Authoritative, Crisp, Confident

---

## 1. Stage Roles & Physical Positioning

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STAGE SETUP & ROLES                              │
├─────────────────────┬──────────────────────────┬────────────────────────────┤
│ Speaker 1: Anchor   │ Speaker 2: Candidate     │ Speaker 3: Architect       │
│ (The Storyteller)   │ (The Pilot / Demo)       │ (The Technical Shield)     │
├─────────────────────┼──────────────────────────┼────────────────────────────┤
│ • Stands downstage  │ • Sits at the laptop     │ • Stands near screen       │
│ • Holds main mic    │ • Wears clean headset mic│ • Points to live metrics   │
│ • Delivers the hook │ • Speaks directly to     │ • Leads the deep math and  │
│   and business case │   Verity during demo     │   judge Q&A defense        │
└─────────────────────┴──────────────────────────┴────────────────────────────┘
```

---

## 2. Minute-by-Minute Pitch Script & Cues

### [00:00 – 00:45] The Hook & The Broken Status Quo (Speaker 1)
* **Screen:** Slide 1 (*"VERITY: Resumes make claims. Verity checks them, out loud."*) $\to$ Slide 2 (*The 2.5-Second Monologue Trap*).
* **Speaker 1:**
  > *"Every engineering hiring process starts with an impossible dilemma. Candidates submit resumes packed with bold claims: 'Built distributed systems,' 'Tuned Kafka,' 'Scaled Kubernetes.'  
  > Recruiters have only two choices. Either force applicants into cold 1-way recorded video interviews that drive over 54% of top candidates to drop out, or spend hundreds of engineering hours on manual screenings that get trivialized by candidates reading off-screen AI copilots.  
  > And at the end? A black-box percentage score that no hiring manager can defend.  
  > We built Verity. Verity is not a multiple-choice quiz bot. It’s an autonomous voice interviewer that investigates resume claims like an elite technical detective."*

---

### [00:45 – 02:00] The Live Hero Demo (Speaker 1 & Speaker 2)
* **Screen:** Switch seamlessly to the **Live 2D Case Board** (`/interview/[id]`). 8 active case rings visible in amber.
* **Speaker 1 (Pointing to screen):**
  > *"Let's look at a live session. Verity has extracted 8 active cases from Alex’s resume. Each case holds three competing hypotheses: Owned, Contributed, and Surface.  
  > Watch Case Number 3: 'Kafka Failover Pipeline.' Verity is currently tied between Owned and Contributed."*

* **The Voice Interaction:**
  * **Verity Speaks Out Loud:**
    > *"Alex, I see you designed the Kafka failover architecture. Which part of that pipeline did you personally decide yourself?"*
  * **Speaker 2 (Intentionally Vague Buzzword Answer):**
    > *"We used Kafka clusters with high availability to process streaming events asynchronously."*
  * **Visual Cue (Speaker 3 points to screen):**
    The ring **shifts toward Surface**. Verity’s Drafter immediately fires a targeted counterfactual probe in $<600\text{ms}$:
  * **Verity Speaks Out Loud:**
    > *"When your consumer group hit partition rebalancing lag during traffic spikes, what specific configuration did you tune?"*
  * **Speaker 2 (Deep Mechanism Answer — THE DEMO MOMENT):**
    > *"We didn’t just restart the brokers; we tuned `max.poll.interval.ms` and adjusted our partition assignment strategy to cooperative sticky rebalance so consumers kept processing during partition handoff..."*

* **THE CLIMAX MOMENT (Speaker 1 Cues Room):**
  * **While Speaker 2 is mid-sentence:** The amber ring **swings dynamically to Emerald Green (dotted line)**.
  * **When Speaker 2 stops speaking:** The ring **locks solid emerald green**.
  * A new receipt pops into the right rail: *"Receipt #14: Cited cooperative sticky rebalance & max.poll.interval.ms trade-off."*
  * **Speaker 2 clicks Receipt #14:** The browser instantly plays the 10-second audio snippet with real-time word highlighting.

---

### [02:00 – 02:45] Technical Feasibility & The Math (Speaker 3)
* **Screen:** Slide 3 (*Feasibility & Architecture*) $\to$ Slide 6 (*Novelty & EIG*).
* **Speaker 3:**
  > *"How did Verity just do that? Two scientific breakthroughs.  
  > First, active learning based on MIT CSAIL’s Battleship research. Verity calculates Expected Information Gain to ask the single question that cuts uncertainty between the two tied hypotheses in half.  
  > Second, we decoupled the Voice Floor from the Intelligence Mind. While the candidate is speaking, Verity speculatively pre-drafts both branches of the next question. When the candidate stops, conversational latency is under 600 milliseconds—zero LLM waiting time.  
  > And because our computer vision runs 100% on-device in WebAssembly, our total infrastructure cost is just 10 cents for a full 15-minute technical interview—75 times cheaper than 3D avatar bots requiring cloud GPUs."*

---

### [02:45 – 03:30] The Recruiter Dossier & Judge Challenge (Speaker 1 & Team)
* **Screen:** Switch to the **Recruiter Dossier** (`/app/dossier/[id]`).
* **Speaker 1:**
  > *"When the interview ends, recruiters don't get an arbitrary 82% score. They get an immutable Dossier of Verifiable Receipts backed by a SHA-256 cryptographic hash chain.  
  > Recruiters can drag this interactive time scrubber to any second of the interview, reconstruct the exact state of the board, and click any claim to hear the candidate's exact voice.  
  > We invite the judges to challenge Verity right now."*

* *(Speaker 2 holds the mic toward the judges for a 30-second rapid interaction, or walks through a secondary case if the judges prefer to transition straight to Q&A).*

---

### [03:30 – 04:00] The Closing Punchline (Speaker 1)
* **Screen:** Slide 9 (*"Resumes make claims. Verity checks them, out loud."*).
* **Speaker 1:**
  > *"Technical screening doesn't need more multiple-choice quizzes, and it doesn't need creepy 3D avatars. It needs the rigor of an unscripted, evidence-based investigation.  
  > Resumes make claims. Verity checks them, out loud.  
  > Thank you, and we're excited to take your questions."*

---

## 3. Emergency Contingency Protocols (What to Do If...)

| Scenario | What Happens | Immediate Contingency Action |
| :--- | :--- | :--- |
| **Wi-Fi drops on stage** | Server running locally on `localhost:8787` | Switch from external provider to `PROVIDERS=fake`. The local fake replays deterministic transcripts and mock TTS; the entire board, belief rings, and UI work 100% offline. |
| **Stage audio feedback** | Microphone echoes through PA | Speaker 2 immediately switches to **Text Mode**: type the exact same answer into the input box. Say: *"Because Verity evaluates text transcripts, candidates can type or speak interchangeably."* |
| **Judge asks an off-topic question** | Judge asks *"What is the weather?"* | Verity’s Fallback Engine re-anchors to the active case: *"I'm focused on investigating your distributed cache project. What part of that did you decide yourself?"* |
