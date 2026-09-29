# Hariharan's Pitch Playbook — Master Anchor & Technical Storyteller

> **Team Role:** Lead Architect, System Integrator & Stage Anchor  
> **Owned Pillars:**  
> • `[02] THE VOICE FLOOR` (4-State FSM, Streaming STT, Sub-120ms AudioWorklet Barge-in)  
> • `[03] FRONTEND & CASE BOARD` (Next.js 16, Interactive Time Scrubber, Dossier)  
> • `[04] INTEGRITY & AUDIT` (MediaPipe Saccade WASM, SHA-256 Hash Chain Log)  
> **Location:** `docs/pitch/hariharan/01_TALKING_POINTS_AND_SPEECH.md`

---

## 1. Your Stage Identity & Cadence

You are the **Lead Anchor and Systems Builder**. You own the opening hook, drive the live product demo, explain the engineering pillars (Pillars 2, 3, and 4), and deliver the closing punchline.
* **Tone:** Apple Keynote style — high-contrast, confident, minimal, and punchy. No nervous filler words.
* **Cadence:** Start with high dramatic tension about the hiring crisis, shift into effortless mastery during the live demo, and close with an unshakeable punchline.

---

## 2. Your Exact Minute-by-Minute Speaking Script

### Segment 1: The Opening Hook & Problem (00:00 – 00:45)
* **Visual:** Slide 1 (*VERITY*) $\to$ Slide 2 (*The 2.5s Monologue Trap*).
* **Your Words:**
  > *"Every engineering hiring process starts with an impossible dilemma. Candidates submit resumes packed with bold claims: 'Built distributed systems,' 'Tuned Kafka,' 'Scaled Kubernetes.'  
  > Recruiters have only two choices. Either force applicants into cold 1-way recorded video interviews that drive over 54% of top candidates to abandon the application, or spend hundreds of manual screening hours that get easily gamed by candidates reading off-screen AI copilots.  
  > And at the end? A black-box score that no hiring manager can defend.  
  > We built Verity. Verity is not a quiz bot. It’s an autonomous voice interviewer that investigates resume claims like an elite technical detective."*

---

### Segment 2: The Live Hero Demo (00:45 – 01:30)
* **Visual:** Switch screen to the **Live 2D Case Board** (`/interview/[id]`). 8 active case rings visible in amber.
* **Your Words (Directing the room):**
  > *"Let's look at a live session. Verity has extracted 8 active project cases from Alex’s resume.  
  > Watch Case Number 3: 'Kafka Failover Architecture.' Verity is currently tied between whether Alex truly Owned it or merely Contributed to it.  
  > Let's answer out loud."*

* **The Voice Interaction:**
  * *Verity Speaks:* *"Alex, I see you designed the Kafka failover architecture. Which part of that pipeline did you personally decide yourself?"*
  * *You give a vague buzzword answer:* *"We used Kafka clusters with high availability to process events asynchronously."*
  * *Point to screen:* *"Notice that the ring stays amber. Verity knows that was a surface-level textbook answer. In under 600 milliseconds, it fires a counterfactual probe:"*
  * *Verity Speaks:* *"When your consumer group hit partition rebalancing lag during traffic spikes, what specific configuration did you tune?"*
  * *You give the deep mechanism answer:* *"We tuned `max.poll.interval.ms` and switched our partition assignment strategy to cooperative sticky rebalance so consumers kept processing during partition handoff..."*

* **THE HERO MOMENT (Your Cue):**
  > *"Look at the screen right now. While I was still speaking mid-sentence, the belief ring swung dynamically toward 'Owned.' And when I finished speaking, it locked solid emerald green.  
  > A new receipt just popped into the rail. I click it, and we hear the exact 10-second audio snippet of my explanation.  
  > To explain the intelligence brain that made this decision, here is Bhooshen."*

*(Hands over to Bhooshen for [01] The Intelligence Mind).*

---

### Segment 3: The Voice Floor, Frontend & Integrity (02:45 – 03:30)
*(Taking back the spotlight after Bhooshen explains the Mind).*

* **Visual:** Slide with Pillars [02], [03], and [04].
* **Your Words:**

#### [02] The Voice Floor:
> *"Now, how do we make the conversation feel like talking to a real human? That’s **The Voice Floor**.  
> We decoupled the audio floor from the intelligence mind using a formal 4-State Finite State Machine. While the candidate speaks, our speculative drafter prepares the next question in the background, driving conversational turn latency under 600 milliseconds.  
> And if the candidate interrupts Verity mid-question, our browser AudioWorklet detects vocal energy and drops playback gain in under 20 milliseconds for instant smart barge-in."*

#### [03] Frontend & The Case Board:
> *"For the frontend, we deliberately rejected uncanny 3D avatars that candidates despise. Instead, we built a calm, deterministic 2D Case Board in Next.js 16.  
> When the interview ends, recruiters don't get an arbitrary percentage score. They get an interactive **Time Scrubber**. Recruiters can drag the slider back to minute four, see the exact state of the board at that second, and click any receipt to hear the candidate's exact words."*

#### [04] Integrity & Audit:
> *"Finally, **Integrity and Audit**. We don't install creepy proctoring spyware or assign 'Cheating Scores' that violate labor laws.  
> Instead, our computer vision runs 100% on-device in WebAssembly using MediaPipe FaceLandmarker—video frames never leave the user's browser. It detects the tell-tale periodic sawtooth eye movements of reading off an auxiliary monitor, while every single interview event is cryptographically sealed into a SHA-256 append-only hash chain compliant with NYC Local Law 144."*

---

### Segment 4: The Closing Punchline (03:30 – 04:00)
* **Visual:** Slide 9 (Center punchline & Live Demo CTA).
* **Your Words:**
  > *"Technical screening doesn't need more multiple-choice quizzes, and it doesn't need creepy 3D avatars.  
  > **Resumes make claims. Verity checks them, out loud.**  
  > We invite the judges to try Verity right now. Thank you!"*
