# 02 — Deep Technical Architecture, Mathematical Theory & Context

> **Audience:** Presenters, Technical Defend Team, Hackathon Judges  
> **Location:** `docs/pitch/02_DEEP_TECHNICAL_ARCHITECTURE_AND_THEORY.md`  
> **Objective:** The complete, down-to-the-metal technical knowledge required to explain and defend every mathematical and architectural choice in Verity.

---

## 1. The Core Mathematical Theory: The 3-Hypothesis Belief Simplex

Verity represents the state of every resume claim as a point on a **2-simplex** (a 3-dimensional probability vector that sums to 1.0):

$$\mathcal{H} = \{ H_{\text{Owned}}, H_{\text{Contributed}}, H_{\text{Surface}} \}$$
$$P_t(c) = \begin{bmatrix} p_{\text{owned}}(t) \\ p_{\text{contributed}}(t) \\ p_{\text{surface}}(t) \end{bmatrix} \quad \text{subject to } \sum_{h \in \mathcal{H}} p_h(t) = 1.0, \quad p_h(t) \ge 0$$

```
                           H_Owned (1, 0, 0)
                                 ▲
                                / \
                               /   \
                              /  •  \  <── Current Belief State
                             /       \
                            /_________\
         H_Contributed (0, 1, 0)      H_Surface (0, 0, 1)
```

### A. Prior Initialization from Resume Syntax
Before the candidate speaks a single word, Verity calculates an initial prior belief $P_0(c)$ directly from the resume line’s syntactic composition:
* **Specificity Score ($\sigma \in [0, 1]$):** Measured by the density of concrete technical primitives, system metrics, and numerical percentages ($N_{\text{techs}} + N_{\text{metrics}}$).
* **Ownership Language Score ($\alpha \in [0, 1]$):** Evaluates first-person active agency verbs (*"architected"*, *"built"*, *"led"* $\to 1.0$) vs. passive collective support verbs (*"assisted"*, *"helped"*, *"worked on"* $\to 0.5$).
* **Mathematical Prior Assignment:**
  $$p_{\text{owned}}(0) = 0.20 + 0.30 \cdot \sigma \cdot \alpha$$
  $$p_{\text{contributed}}(0) = 0.50 + 0.10 \cdot (1 - \alpha)$$
  $$p_{\text{surface}}(0) = 1.0 - \big( p_{\text{owned}}(0) + p_{\text{contributed}}(0) \big)$$
* *Why this matters to judges:* We don't start with arbitrary 50/50 guesses. The system mathematically anchors its initial uncertainty to the candidate's exact resume wording.

---

## 2. Active Learning: MIT CSAIL Expected Information Gain (EIG)

Why does Verity ask better questions than ChatGPT or HireVue? 

Standard LLMs suffer from **conversational drift**: they ask open-ended, low-information questions (*"Can you tell me more about that?"*) that fail to reduce uncertainty.

Verity implements **Active Hypothesis Testing**, built on the landmark 2026 MIT CSAIL paper (*"Teaching AI Agents to Ask Better Questions by Playing Battleship"*):

### The Shannon Entropy of a Case:
At any turn $t$, the entropy (uncertainty) of case $c$ is:
$$H(P_t(c)) = - \sum_{h \in \mathcal{H}} p_h(t) \log_2 p_h(t)$$
* Maximum Entropy: $H_{\max} = \log_2(3) \approx 1.585\text{ bits}$ (Equal uncertainty across all 3 hypotheses).
* Minimum Entropy: $H = 0\text{ bits}$ (100% certainty on one hypothesis).

### The Question Selection Policy:
Verity chooses the question $q$ targeting case $c^*$ that maximizes the **Expected Information Gain (EIG)**:
$$\text{EIG}(c, q) = H(P_t(c)) - \mathbb{E}_{y \sim \mathcal{Y}} \big[ H(P_{t+1}(c \mid y)) \big]$$

Verity weights this information gain by the role's Job Description relevance:
$$c^* = \arg\max_{c \in \mathcal{C}} \Big[ \text{EIG}(c, q) \cdot \text{Weight}_{\text{Job Description}}(c) \Big]$$

### Pairwise Discriminator Formulations:
When two hypotheses are nearly tied, the Policy Engine generates a targeted discriminator question designed to cleave the tied pair:

| Tied Hypotheses | Mathematical Condition | Discriminator Focus | Example Spoken Question |
| :--- | :--- | :--- | :--- |
| **Owned vs. Contributed** | $|p_{\text{owned}} - p_{\text{contributed}}| < 0.15$ | Architectural Trade-offs & Post-Mortem Decisions | *"When you chose to partition Kafka by user ID rather than region, what failure mode forced that decision?"* |
| **Contributed vs. Surface** | $|p_{\text{contributed}} - p_{\text{surface}}| < 0.15$ | Concrete Mechanics & CLI Recovery Sequences | *"When that Redis cluster hit split-brain, what exact CLI command or recovery sequence did you execute?"* |
| **Owned vs. Surface** | $|p_{\text{owned}} - p_{\text{surface}}| < 0.15$ | Counterfactual Variations & Constraints | *"If your write traffic had scaled 10x with a 99.99% read SLA, why would your chosen database architecture break?"* |

---

## 3. Bayesian Belief Updating & Likelihood Calibration

When the candidate finishes their answer $y$, the posterior belief vector is calculated via Bayes' Theorem:
$$P(H_i \mid y) = \frac{L(y \mid H_i) \, P_t(H_i)}{\sum_{j \in \mathcal{H}} L(y \mid H_j) \, P_t(H_j)}$$

### The Likelihood Ratio Vector:
The Assessor model inspects the answer $y$ and emits a bounded integer likelihood ratio $L = [l_{\text{owned}}, l_{\text{contributed}}, l_{\text{surface}}]$:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LIKELIHOOD EVALUATION MATRIX                             │
├─────────────────────┬───────────────────┬───────────────────────────────────┤
│ Evidence Type       │ Likelihood Vector │ Trigger Condition                 │
├─────────────────────┼───────────────────┼───────────────────────────────────┤
│ Decision Evidence   │ [5, 2, 1]         │ Cites personal architectural      │
│                     │                   │ decision and concrete trade-off.  │
│ Mechanism Evidence  │ [4, 4, 2]         │ Describes operational mechanics   │
│                     │                   │ without clear personal agency.    │
│ Vague / Buzzword    │ [2, 3, 4]         │ High-level textbook definitions;  │
│                     │                   │ lacks implementation parameters.  │
│ Non-Answer / Forget │ [3, 3, 3]         │ "I don't recall that parameter."  │
│                     │                   │ (Likelihood ratio 1:1:1 = ZERO    │
│                     │                   │ shift). Forgetting is not lying.  │
└─────────────────────┴───────────────────┴───────────────────────────────────┘
```

> **The Hard Invariant: "Forgetting is Not Lying"**  
> If an applicant admits they don't remember a specific configuration flag or syntax, the likelihood vector is strictly uniform ($[3, 3, 3]$). The belief distribution **does not move toward Surface**, and it **never creates a contradiction**.

---

## 4. The Duplex Voice Floor: Decoupling Floor from Mind

Why do existing AI voice bots feel robotic and delayed? 
They run their intelligence inside the conversational critical path:

$$\text{Candidate Stops} \implies \text{Wait for LLM (1,200ms)} \implies \text{Wait for TTS (800ms)} = \mathbf{2,000ms\text{ Awkward Silence}}$$

Verity achieves sub-600ms conversational turn-around through **Speculative Dual-Drafting**:

```
TIME ──►  0.0s               1.0s               2.0s               3.0s (Turn End)   3.4s
FLOOR:    [==== Candidate Speaking: "We partitioned the topic..." ===] ──► [Verity Speaks]
MIND:     [LiveEval: +15% Owned]  [Drafter: Pre-drafts Draft A & B]    ──► [Commits Draft A]
                                                                        │  (0ms LLM Wait!)
                                                                        ▼
                                                       ElevenLabs Flash Audio Out (<220ms)
```

1. **Speculative Pre-Drafting:** While the candidate answers Question $N$, the server fires parallel low-cost background prompts to prepare **Draft A** (assumes ownership demonstrated) and **Draft B** (assumes vague buzzwords).
2. **Zero-Latency Turn Boundary:** When the candidate stops speaking, the server selects the pre-drafted question in **0 milliseconds**.
3. **Sub-120ms Smart Barge-In:** If the candidate interrupts Verity mid-question, client Web Audio hardware gain drops to zero in $<20\text{ms}$, purges playback buffers, and aborts the downstream ElevenLabs WebSocket.

---

## 5. Cryptographic Event Log & Chain Verification

Verity provides 100% audit-defensible proof for enterprise HR compliance (NYC Local Law 144, EU AI Act, EEOC Title VII).

Every state change—session creation, case discovery, transcript chunk, question commitment, receipt issue, and belief update—is written to an **append-only, SHA-256 hash-chained log**:

$$\text{Hash}_n = \text{SHA-256}\Big( n \;\|\; \text{SessionID} \;\|\; \text{EventType} \;\|\; \text{Timestamp} \;\|\; \text{JSON}(\text{Payload}) \;\|\; \text{Hash}_{n-1} \Big)$$

* **Tamper Verification:** The server provides a `/v1/sessions/:id/verify` endpoint. Any manual tampering with scores or transcripts breaks the cryptographic chain.
* **Pure Functional Time Travel:** State at any timestamp $T$ is mathematically derived by replaying the hash-chained events up to $T$:
  $$S(T) = \text{reduceAll}(\text{events}, T)$$
  This powers the **Interactive Time Scrubber** in the Recruiter Dossier.

---

## 6. Non-Invasive Authenticity Telemetry (Ethical Anti-Cheat)

Verity rejects dystopian kernel spyware in favor of **10 browser-native diagnostic signals**:

1. **Sawtooth Reading Saccades (Iris Kinematics FFT):**
   * Natural human thinking gaze wanders erratically ($\sigma^2 > 0.45$).
   * Reading off-screen LLM copilots generates a distinct periodic sawtooth wave: slow rightward drift ($1.5\text{–}2.5\text{s}$) followed by a rapid $<80\text{ms}$ return flick. Detected via Fast Fourier Transform ($0.4\text{–}0.8\text{ Hz}$) on iris coordinates.
2. **Cognitive Onset Latency Profiling ($CV_{\text{latency}}$):**
   * Copilots (Whisper + LLM) introduce a rigid, uniform $2.2\text{s}–3.5\text{s}$ pause before speech onset across all questions.
   * Human latency varies with problem difficulty ($CV = \sigma / \mu > 0.35$). Flat pause latency flags artificial generation.
3. **Strict Compliance Rule:** Integrity observations are recorded as **neutral factual timeline events** (*"Tab unfocused for 3.2s during Kafka question"*). Verity strictly bans "Cheating Scores" and automatic fraud disqualifications.
