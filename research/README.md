# Research notes

Early landscape and strategy notes for the BNB hackathon. The product that shipped from this work is [Verity](../README.md). Some pages still use an earlier working name or deck figures; treat those as research, not as the current spec.

---

## 📑 Research Subpages Navigation

| Subpage | Title | Core Focus & Contents |
| :--- | :--- | :--- |
| **[Subpage 01](01_COMPETITOR_LANDSCAPE.md)** | **Competitor Landscape** | Complete breakdown of VC-backed startups (Alex/Apriora, Micro1, Lightscreen AI), Enterprise giants (HireVue, Karat), Candidate Copilots (Final Round AI), funding, pricing models, and key weaknesses. |
| **[Subpage 02](02_USER_PAIN_POINTS_REDDIT_COMMUNITY.md)** | **Voice of the Market & Pain Points** | Raw unfiltered community sentiment from Reddit (`r/recruitinghell`, `r/cscareerquestions`, `r/jobs`), candidate hatred of "talking to HAL 9000", proctoring false-positive witch hunts, and recruiter cheating epidemics. |
| **[Subpage 03](03_TECH_STACK_AND_FAILURE_MODES.md)** | **Tech Stack & Failure Modes** | Architectural autopsy of existing tools: the 2.5s cascaded latency trap, server GPU bandwidth wall ($0.50/min), facial emotion pseudoscience, and LLM sycophancy. |
| **[Subpage 04](04_STRATEGY_HOW_TO_BEAT_THEM.md)** | **Strategy: How We Beat Them** | Our winning hackathon playbook: Socratic Claim Probing, Edge-Native Zero-GPU Integrity Telemetry, Dual-Sided Value (Candidate Growth + Recruiter Dossier), and 4-minute demo pitch script. |
| **[Subpage 05](05_MASTER_SLIDE_DECK_CONTENT.md)** | **Official Presentation Deck Blueprint** | Slide-by-slide copy ready to copy-paste into `BNB-IDEA-Presentation-Format.pptx` (Slides 1–9) with exact speaker scripts, metrics, and Q&A defenses. |
| **[Subpage 06](06_TEN_TOOLS_DETAILED_REVIEW.md)** | **Critical Audit: 10 AI Interview Tools** | Deep deconstruction of 10 popular tools (Interview Sidekick, HireVue, VMock, Pramp, Karat, CoderPad, MyInterview, PrepAI, Sapia, Google Warmup) vs. ground truth. |
| **[Subpage 07](07_POLISHED_SYSTEM_DESIGN_AND_25_ALGORITHMS.md)** | **Polished System Design & 25 Core Algorithms** | Live Knowledge Graph, Evidence Debt, sub-500ms voice loop, smart barge-in interruption, and 25 mathematical/code algorithms. |
| **[Subpage 08](08_FRONTIER_ARXIV_RESEARCH_AND_3_INSANE_IDEAS.md)** | **Frontier Research & 3 Breakthrough Architectures** | MIT Battleship Active Learning, MimiTalk Dual-Agent Constitutional AI, LSE & 70k field experiment, and 3 breakthrough hackathon architectures. |
| **[Subpage 09](09_FULL_BUILD_AND_IMPLEMENTATION_PLAN.md)** | **Full Build & Execution Blueprint** | Detailed 4-state duplex loop code, data models, repository structure, and 48-hour hackathon execution roadmap. |
| **[Subpage 10](10_ADVANCED_ANTI_CHEAT_AND_AUTHENTICITY_FACTORS.md)** | **Advanced Anti-Cheat & Authenticity Factors** | 10 browser-native signals (reading saccades, TTFT onset latency, virtual audio cables, keystroke soundprints, Socratic honeypots) + UI references. |

---

## 🎯 Executive Synthesis of the Problem Statement

The BNB Problem Statement demands 3 core capabilities:
1. **Profile-Aware Questioning and Evaluation:** Must understand candidate resume in context of target role, ask tailored questions, and generate actionable evaluation reports.
2. **Conversational and Adaptive Interviewing:** Natural spoken dialogue that dynamically probes deeper where the candidate shows strength and adapts gracefully where they struggle.
3. **Interview Integrity Monitoring:** Observes candidate attention, identifies behavior indicating external help (e.g. looking away at second screens), and presents transparent telemetry to recruiters.

### Why Existing Solutions Fail:
- **HireVue & Asynchronous Platforms:** Forced candidates into a cold, 1-way recorded monologue. Candidates despise it (54%+ drop-off). Their facial emotion AI was struck down by the FTC for unscientific bias.
- **Current Live AI Avatars (Alex/Apriora, Micro1):** Suffer from severe turn-taking latency (1.8s–3.0s) and superficial question banks. They cannot dynamically probe complex technical claims.
- **Candidate Cheat Tools (Final Round AI, Whisper Copilots):** Candidates cheat in remote interviews by reading real-time LLM suggestions off secondary monitors.

### How Verity approaches it:
- **Full-Duplex Conversational Voice (<600ms):** Eliminates awkward delays and uncanny-valley avatars in favor of fluid human-like dialogue with barge-in interruption handling.
- **Dynamic Socratic Probing:** Reads specific resume project claims and asks unscripted follow-up questions, immediately exposing teleprompter readers.
- **100% Edge-Based Integrity Telemetry:** Runs MediaPipe FaceLandmarker inside the candidate's browser via WebAssembly. **Zero video streaming to cloud, zero GPU server costs, and complete candidate privacy.**
- **Dual-Sided Scorecards:** Empowers candidates with personalized growth coaching while arming recruiters with audit-defensible hiring dossiers.
