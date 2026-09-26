# 04 — Core Algorithms, Mathematical Formulations & Intelligence

> **Target Platform:** Verity (formerly SocraticHire)  
> **Hackathon Track:** AI/ML Track — Problem Statement: AI-Powered Interview Bot  
> **Mathematical Foundations:** MIT CSAIL Active Learning (ICLR 2026 Oral), Bayesian Hypothesis Separation, Shannon Information Theory  
> **Source Document:** Curated for NotebookLM Ingestion & Algorithmic Rigor

---

## 1. The Mathematical Foundation: Active Hypothesis Separation

Verity models every candidate resume claim as a discrete probabilistic case holding three competing hypotheses:
$$\mathcal{H} = \{ H_{\text{Owned}}, H_{\text{Contributed}}, H_{\text{Surface}} \}$$

At any turn $t$, a case $c$ possesses a categorical belief distribution:
$$P_t(c) = \big[ p_{\text{owned}}(t), \; p_{\text{contributed}}(t), \; p_{\text{surface}}(t) \big] \quad \text{where } \sum_{h \in \mathcal{H}} p_h(t) = 1$$

```
         ┌────────────────────────────────────────────────────────┐
         │              THE 3-HYPOTHESIS SIMPLEX                  │
         │                                                        │
         │                    H_Owned                             │
         │                     ▲                                  │
         │                    / \                                 │
         │                   /   \                                │
         │                  /  •  \  <── Current Belief           │
         │                 /       \                            │
         │                /_________\                             │
         │      H_Contributed         H_Surface                   │
         └────────────────────────────────────────────────────────┘
```

---

## 2. Question Selection: Maximizing Expected Information Gain (EIG)

Inspired by MIT CSAIL’s groundbreaking ICLR 2026 research (*"Teaching AI Agents to Ask Better Questions by Playing Battleship"*), Verity rejects fixed question scripts. 

Instead, Verity selects the next question by calculating the **Expected Information Gain (EIG)** across all active cases on the board.

### The Formulation:
Let Shannon entropy $H(P_t(c))$ measure the uncertainty of case $c$:
$$H(P_t(c)) = - \sum_{h \in \mathcal{H}} p_h(t) \log_2 p_h(t)$$

The Expected Information Gain of asking a candidate response query $q$ targeting case $c$ is:
$$\text{EIG}(c, q) = H(P_t(c)) - \mathbb{E}_{y \sim \mathcal{Y}}\big[ H(P_{t+1}(c \mid y)) \big]$$

Verity selects the optimal case $c^*$ and discriminator question $q^*$ that maximizes information gain while prioritizing cases tied between the top two hypotheses:
$$c^* = \arg\max_{c \in \mathcal{C}} \Big[ \text{EIG}(c, q) \cdot \mathbb{I}(\text{Weight}_{\text{Job Description}}(c)) \Big]$$

### The Pairwise Discriminator Strategy:
When two hypotheses are tied (e.g. $p_{\text{owned}} \approx p_{\text{contributed}}$), Verity generates a **Pairwise Discriminator Question**:

| Tied Pair | Target Discriminator Angle | Example Generated Question |
| :--- | :--- | :--- |
| **Owned vs. Contributed** | *Design Decisions & Trade-offs:* Did they choose the architecture, or did they just maintain someone else's spec? | *"When you chose to partition Kafka topics by user ID rather than region, what failure mode forced that decision?"* |
| **Contributed vs. Surface** | *Mechanics & Recovery:* Can they describe the concrete steps taken during a real system outage? | *"When that Redis cluster hit split-brain, what exact CLI command or recovery sequence did you execute?"* |
| **Owned vs. Surface** | *Counterfactuals:* If constraints changed, how would the architecture adapt? | *"If your write traffic had scaled 10x with a 99.99% read SLA, why would your chosen database architecture break?"* |

---

## 3. Bayesian Belief Updating & Likelihood Calibration

When the candidate completes their answer $y$, the posterior belief distribution updates via Bayes' Theorem:
$$P(H_i \mid y) = \frac{P(y \mid H_i) \, P_t(H_i)}{\sum_{j \in \mathcal{H}} P(y \mid H_j) \, P_t(H_j)}$$

### Calibrated Likelihood Scoring:
The likelihood $P(y \mid H_i)$ is evaluated by the Assessor model across three structured evidentiary axes:
1. **Mechanism Depth ($\lambda_M$):** Presence of concrete technical primitives, error codes, internal system parameters, and architecture trade-offs.
2. **First-Person Agency ($\lambda_A$):** Distinguishing personal intervention (*"I reconfigured..."*, *"We debugged and I found..."*) from collective abstraction (*"It was built..."*).
3. **Counterfactual Consistency ($\lambda_C$):** Ability to explain why alternate solutions were rejected.

> **Hard Invariant: Forgetting is Not Lying.**  
> If a candidate says *"I don't recall that specific parameter"* or *"I'd have to check our post-mortem docs"*, the likelihood remains neutral. Forgetting never penalizes a candidate toward Surface and never triggers a contradiction.

---

## 4. Speculative Dual-Drafting Algorithm

To eliminate the 2.5-second turn latency, the Mind engine pre-computes follow-up questions during candidate speech using speculative branch execution:

```python
# Speculative Dual-Drafting Engine Pseudocode
async def speculative_drafter_loop(session_id, active_case, interim_transcript_stream):
    """
    Runs in parallel with candidate speech. Continuously refines Draft A and Draft B.
    """
    draft_a = None  # Optimistic branch: Assumes candidate substantiated Ownership
    draft_b = None  # Probing branch: Assumes candidate was vague / Surface

    async for chunk in interim_transcript_stream:
        # Update provisional belief (runs every 1.5 seconds)
        provisional_belief = await live_eval_fast_classifier(chunk, active_case)
        emit_event("BELIEF_UPDATED", provisional=True, belief=provisional_belief)

        # Pre-draft two high-probability follow-ups in background LLM context
        draft_a = background_llm_draft(active_case, branch="DEEPEN_OWNERSHIP", context=chunk)
        draft_b = background_llm_draft(active_case, branch="PROBE_MECHANISM", context=chunk)

    # When candidate stops talking:
    end_of_turn = await wait_for_end_of_turn_signal()
    
    # Zero-latency commit: Select branch instantly based on final provisional vector
    selected_question = draft_a if provisional_belief.owned > 0.50 else draft_b
    commit_to_event_log("QUESTION_COMMITTED", selected_question)
    stream_to_elevenlabs_tts(selected_question)
```

---

## 5. The Consistency Ledger & Polite Contradiction Protocol

A major flaw of human interviewers is forgetting what the candidate said 15 minutes ago. Verity maintains a global **Fact Consistency Ledger**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      GLOBAL CONSISTENCY LEDGER                         │
 ├──────────┬────────────────────────────────────────┬────────────────────┤
 │ Turn 02  │ "Our team had 4 backend engineers."    │ Claim: Team Size   │
 │ Turn 08  │ "I was the sole engineer on the repo." │ Claim: Solo Owner  │
 └──────────┴────────────────────────────────────────┴────────────────────┘
                                   │
                                   ▼
                 [CONTRADICTION CANDIDATE DETECTED]
```

### The 3-Step Polite Contradiction Protocol:
To avoid false accusations or aggressive hostility, Verity enforces a strict verification rule:
1. **Two Cited Statements:** The system must locate two explicit, timestamped transcript statements that directly conflict.
2. **One Polite Reconcile Question:** Verity must ask a gentle, open-ended clarifying question:
   * *"Earlier you mentioned you were the sole engineer on the repo, and earlier you noted working with a team of four. Could you help me understand how responsibilities were divided?"*
3. **Resolution vs. Flag:**
   * If the candidate explains (*"I was solo during the MVP phase, then three contractors joined for the migration"*), the discrepancy is reconciled.
   * Only if the candidate fails to reconcile or doubles down on contradictory facts is the case tagged with a `CONFLICT` receipt.

---

## 6. Comprehensive Catalogue of the 25 Core Algorithms

Verity’s backend combines 25 purpose-built algorithms spanning four technical disciplines:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       25 CORE SYSTEM ALGORITHMS                             │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│ Active Learning & Mind  │ Voice & Floor Control   │ Integrity & Telemetry   │
│ (Algorithms 1–8)        │ (Algorithms 9–16)       │ (Algorithms 17–25)      │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ 1. Battleship EIG Select│ 9. Dual-Stream Duplex   │ 17. Iris Saccade FFT    │
│ 2. 3-Hypothesis Simplex │ 10. Sub-120ms Smart Duck│ 18. Response Onset CV   │
│ 3. Likelihood Calibrator│ 11. Local Backchannel   │ 19. Tab Focus Debouncer │
│ 4. Speculative Drafter  │ 12. Audio Worklet Flush │ 20. Diarization Diarizer│
│ 5. Heuristic LiveEval   │ 13. Echo Cancellation   │ 21. Socratic Honeypot   │
│ 6. Consistency Ledger   │ 14. Flux Turn Endpointer│ 22. Perplexity Scorer   │
│ 7. Polite Reconcile FSM │ 15. ElevenLabs WS Stream│ 23. Head Pitch Detector │
│ 8. Evidence Debt Matrix │ 16. Stereo WAV Stitcher │ 24. Multi-Face Counter  │
│                         │                         │ 25. Hash-Chain Signer   │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

1. **Battleship EIG Policy:** Shannon entropy reduction across active resume claims.
2. **3-Hypothesis Simplex Projection:** Normalizes Owned, Contributed, Surface probabilities to sum to 1.0.
3. **Tri-Axis Likelihood Calibrator:** Evaluates agency, mechanism depth, and counterfactuals.
4. **Speculative Dual-Drafter:** Parallel LLM pre-generation eliminating conversational latency.
5. **Heuristic LiveEval:** 1.5s streaming classifier updating UI rings mid-utterance.
6. **Fact Consistency Ledger:** Vectorized statement tracking cross-referencing past answers.
7. **Polite Reconcile FSM:** Guardrail ensuring contradictions require explicit clarification.
8. **Evidence Debt Matrix:** Prioritizes unexamined high-seniority resume claims.
9. **Dual-Stream Duplex Router:** Multiplexes simultaneous candidate mic and bot audio.
10. **Smart Barge-In Ducking:** Sub-40ms gain reduction upon candidate vocal energy onset.
11. **Local Backchannel Injector:** Zero-cost on-device micro-affirmations (*"mhm"*).
12. **Audio Worklet Queue Flusher:** Immediate hardware buffer zeroing on interrupt.
13. **Acoustic Echo Guard:** Prevents bot's own voice from triggering candidate VAD.
14. **Flux Turn-Boundary Predictor:** Conversational endpointing using acoustic + linguistic cues.
15. **Pre-Warmed TTS WebSocket Pool:** Maintains active TLS connection to ElevenLabs Flash v2.5.
16. **Synchronized Stereo Audio Recorder:** Left channel candidate, right channel bot, sample-accurate.
17. **Iris Saccade Kinematics (FFT):** Identifies sawtooth teleprompter reading frequencies ($0.4\text{–}0.8\text{ Hz}$).
18. **Response Onset Variance ($CV_{\text{latency}}$):** Flags unnatural 2.5s copilot processing lag.
19. **Tab Visibility Debouncer:** Ignores brief (<1.5s) window focus shifts.
20. **STT Diarization Guard:** Flags auxiliary whispering in candidate's room.
21. **Socratic Counterfactual Honeypot:** Unannounced parameter variations exposing static cheat sheets.
22. **Linguistic Perplexity Scorer:** Measures entropy of candidate's spoken vocabulary.
23. **Head Pose Pitch Estimator:** MediaPipe FaceLandmarker pitch angle tracking.
24. **Multi-Face Presence Observer:** Logs secondary persons appearing in camera frame.
25. **SHA-256 Hash Chain Verifier:** Cryptographically validates event log immutability.
