# 01 — The Optimal Live Demo Strategy: How to Demo Verity to Win

> **Audience:** Pitch Team & Presenters  
> **Location:** `docs/pitch/01_THE_OPTIMAL_DEMO_STRATEGY.md`  
> **Objective:** Deliver an unforgettable, bulletproof 4-minute demo that proves Verity's breakthrough without falling into live-demo traps.

---

## 1. Deconstructing the "Let the Judge Take the Interview" Idea

Your initial intuition—*letting the judge take an interview live while explaining what’s happening in the background*—is a great emotional instinct because it proves the product is real.

However, after analyzing hundreds of winning hackathon demos (and disastrous failures), **uncontrolled live judge interviews carry three fatal risks**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE 3 PITFALLS OF UNCONTROLLED JUDGE DEMOS               │
├─────────────────────┬──────────────────────────┬────────────────────────────┤
│ Risk 1: The Awkward │ Risk 2: The Chatbot Trap │ Risk 3: Noise & Acoustic   │
│ Cold-Start (60s lost│                          │ Chaos                      │
├─────────────────────┼──────────────────────────┼────────────────────────────┤
│ The judge hasn't    │ Judges often don't       │ Hackathon halls have echo, │
│ uploaded their CV.  │ answer seriously; they   │ crowd roar, and feedback.  │
│ Watching someone    │ try to "test" the bot by │ Background noise can cause │
│ browse files kills  │ asking trivia: "Who won  │ VAD misfires or garbled    │
│ pitch momentum.     │ the 1998 World Cup?"     │ STT transcription.         │
└─────────────────────┴──────────────────────────┴────────────────────────────┘
```

If the judge acts like a generic chatbot user (*"Tell me a joke"* or *"What is 2+2?"*), **Verity will look like a broken Siri rather than an elite technical detective**. Verity is an investigator of *resume claims*, not a chit-chat bot.

---

## 2. The Winning Demo Format: "The Dual-Screen Detective" (2-Phase Hybrid)

The highest-scoring demo format splits your 4-minute presentation into two choreographed phases:

```
  TIME: 0:00 ──────────────── 1:30 ──────────────── 3:00 ─────────────── 4:00
        │  PHASE 1: THE GUIDED HERO DEMO  │  PHASE 2: THE JUDGE CHALLENGE  │ Q&A
        │  (Flawless, Scripted Execution) │  (Controlled Interactive Mic)  │
```

### Phase 1: The Guided Hero Demo (90 Seconds)
* **Setup:** Have a live session already active on screen with a real technical resume loaded (e.g. Senior Distributed Systems Engineer with a claim: *"Designed high-throughput Kafka streaming pipeline for financial transactions"*).
* **The Presenter is the Candidate:** One team member acts as the candidate speaking into a clean lapel/headset mic.
* **The Two-Turn Contrast (The "Aha!" Moment):**
  1. **Turn 1 (Surface/Vague):** Verity asks its opening probe: *"Which part of that Kafka pipeline did you design yourself?"*  
     The presenter intentionally gives a textbook, buzzword-heavy answer:  
     *Candidate: "We used Kafka clusters with high availability to process events asynchronously."*  
     **Visual:** The Case Board ring **stays Amber / shifts toward Surface**. Verity immediately fires a targeted counterfactual follow-up:  
     *Verity: "When your consumer group hit partition rebalancing lag during traffic spikes, what specific configuration did you tune?"*
  2. **Turn 2 (The Mid-Sentence Emerald Lock):**  
     The presenter speaks out loud with concrete engineering mechanism depth:  
     *Candidate: "We didn't just restart the brokers; we tuned `max.poll.interval.ms` and adjusted our partition assignment strategy to cooperative sticky rebalance..."*  
     **THE HERO MOMENT:** **While the presenter is still uttering the words, the belief ring on screen SWINGS DYNAMICALLY to Emerald Green (dotted line).** When the presenter stops speaking, the ring **LOCKS SOLID EMERALD GREEN**. A new receipt tile pops into the feed.
  3. **The Proof:** Click the receipt tile. The browser plays the 10-second synchronized audio snippet with word-by-word karaoke highlighting.

### Phase 2: The Judge Challenge (60 Seconds)
Now that the judges have seen the magic and understand the rules, **hand the microphone to a judge**:

> *"Judge, we invite you to test Verity right now. Claim you built any open-source tool, or try to give a vague answer to this Redis question, and watch how Verity's active learning algorithm separates what you built from what you read in a tutorial."*

* By framing the interaction around a specific active case on the board, the judge is guided to answer the actual architectural question.
* Even if the judge stumbles, laughs, or gives a short answer, Verity's **heuristic fallback and polite reconcile engine** handles it gracefully.

---

## 3. Physical Hardware & Screen Layout on Stage

To make the demo look like an Apple Keynote, configure your hardware as follows:

```
┌───────────────────────────────────────┐   ┌───────────────────────────────────┐
│        PROJECTOR / MAIN SCREEN        │   │        PRESENTER LAPTOP           │
│                                       │   │                                   │
│   ┌───────────────────────────────┐   │   │  • Fastify Server running locally │
│   │   THE LIVE 2D CASE BOARD      │   │   │    on port 8787                   │
│   │   (Belief Rings & Live Orb)   │   │   │  • Next.js running on port 3000   │
│   └───────────────────────────────┘   │   │  • WebRTC audio input via clean   │
│   ┌───────────────────────────────┐   │   │    directional USB microphone     │
│   │   REAL-TIME RECEIPTS FEED     │   │   │  • Secondary display mirroring    │
│   └───────────────────────────────┘   │   │    to projector                   │
└───────────────────────────────────────┘   └───────────────────────────────────┘
```

### Critical Audio Guidelines:
1. **Never use laptop built-in microphones:** Laptop mics pick up stage room echo and audience noise. Use a directional USB microphone, a wireless lavalier, or high-quality AirPods.
2. **Pre-heat the server:** Boot the Fastify server and Next.js client 5 minutes before walking on stage. Verify the `/health` endpoint returns `ok: true`.
3. **Keep Text Mode as an Invisible Stage Fallback:** If stage Wi-Fi drops or ElevenLabs hits an unexpected network timeout, you can instantly type the answer in the transcript input box. The core engine, case graph, and belief rings will continue to function flawlessly.
