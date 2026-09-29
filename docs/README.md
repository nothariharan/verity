# Verity — hackathon notes

Background writing for the BNB International Hackathon, AI/ML track. Start with the [project README](../README.md) for how to run the app. The build plan is in [`plan/`](../plan/README.md). Stage scripts are in [`pitch/`](pitch/README.md).

These files are the write-up and the NotebookLM source set. Latency, cost, and legal lines in them are notes for the deck, not measurements from this repository.

The early blueprint that used to sit in the repo root is [`reference/MASTER_AI_INTERVIEW_BOT_BLUEPRINT.md`](reference/MASTER_AI_INTERVIEW_BOT_BLUEPRINT.md). Slide files and the demo recording are in `decks/` and `recordings/`. Those binaries are gitignored.

---

## 📑 Documentation Index & Content Map

| Document | Title | Core Focus & Contents |
| :--- | :--- | :--- |
| **[`01_EXECUTIVE_SUMMARY_AND_VISION.md`](01_EXECUTIVE_SUMMARY_AND_VISION.md)** | **Executive Summary & Core Identity** | Product identity, the "Detective vs. Quiz" paradigm, the 3 hypotheses (*Owned / Contributed / Surface*), the demo moment, and Apple HIG tenets. |
| **[`02_PROBLEM_STATEMENT_AND_MARKET_FAILURE.md`](02_PROBLEM_STATEMENT_AND_MARKET_FAILURE.md)** | **Problem Statement & Market Breakdown** | Audit of 40+ competitor tools, 1-way video monologue failures (54% drop-off), the 2.5s turn-latency trap, FTC HireVue controversies, and candidate AI copilots. |
| **[`03_SYSTEM_ARCHITECTURE_AND_DUPLEX_ENGINEERING.md`](03_SYSTEM_ARCHITECTURE_AND_DUPLEX_ENGINEERING.md)** | **System Architecture & Voice Loop** | Full-duplex voice architecture, the 4-state Voice FSM (*Listen, Backchannel, Speak, Yield*), Floor vs. Mind separation, <600ms latency budget, and WebSockets. |
| **[`04_CORE_ALGORITHMS_AND_MATHEMATICAL_MODELS.md`](04_CORE_ALGORITHMS_AND_MATHEMATICAL_MODELS.md)** | **Algorithms & Mathematical Models** | MIT CSAIL "Battleship" Expected Information Gain (EIG), Bayesian belief simplex updates, speculative dual-drafting, and the 25 core algorithms catalogue. |
| **[`05_RECEIPTS_DOSSIER_AND_HASH_CHAINED_AUDIT.md`](05_RECEIPTS_DOSSIER_AND_HASH_CHAINED_AUDIT.md)** | **Receipts Dossier & Audit Trail** | "Receipts, Not Numbers" philosophy, SHA-256 cryptographic append-only event log, interactive time scrubber, and candidate practice growth report. |
| **[`06_PRIVACY_FIRST_INTEGRITY_AND_AUTHENTICITY.md`](06_PRIVACY_FIRST_INTEGRITY_AND_AUTHENTICITY.md)** | **Privacy-First Integrity Telemetry** | 10 stealth authenticity signals (sawtooth reading saccades, response onset latency $CV$, honeypots), zero-video cloud streaming, and banning cheating scores. |
| **[`07_FEASIBILITY_UNIT_ECONOMICS_AND_ROADMAP.md`](07_FEASIBILITY_UNIT_ECONOMICS_AND_ROADMAP.md)** | **Feasibility & Unit Economics** | Production API stack, $0.10/interview cost model (75x cheaper than $7.50 GPU avatar bots), browser zero-install, and 48-hour hackathon execution roadmap. |
| **[`08_APPLE_HIG_DESIGN_SYSTEM_AND_SLIDE_BLUEPRINT.md`](08_APPLE_HIG_DESIGN_SYSTEM_AND_SLIDE_BLUEPRINT.md)** | **Apple HIG Slide-by-Slide Blueprint** | Complete slide-by-slide copy for all 9 slides of `BNB-IDEA-Presentation-Format.pptx`, Apple Human Interface Guidelines styling, verbatim speaker scripts, and Q&A defenses. |
| **[`09_NOTEBOOK_LM_MASTER_PROMPT.md`](09_NOTEBOOK_LM_MASTER_PROMPT.md)** | **NotebookLM Master Prompt & Guide** | Ready-to-paste master instruction prompt to upload into NotebookLM for generating slides, podcasts, and presentation scripts. |

---

## 🚀 How to Ingest into NotebookLM

1. Open [Google NotebookLM](https://notebooklm.google.com/).
2. Create a new notebook titled: **`Verity — AI Voice Interview Bot (BNB Hackathon)`**.
3. Upload all `.md` files in this `docs/` folder as source documents.
4. Copy the complete prompt inside **[`09_NOTEBOOK_LM_MASTER_PROMPT.md`](09_NOTEBOOK_LM_MASTER_PROMPT.md)** and paste it into NotebookLM's chat box.
5. NotebookLM will generate the complete, slide-by-slide Apple Keynote style presentation with verbatim speaker scripts, layout guides, and Q&A defenses.
