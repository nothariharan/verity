# 09 — Master NotebookLM Presentation Prompt & Execution Guide

> **Purpose:** Master Instruction Prompt to copy-paste directly into **NotebookLM** after uploading all markdown files in the `docs/` folder as sources.  
> **Output Goal:** Generates an executive, Apple-Keynote-grade 9-slide presentation and audio briefing adhering strictly to the official hackathon template (`BNB-IDEA-Presentation-Format.pptx`) and Apple’s Human Interface Guidelines (HIG).

---

## 📋 How to Use This in NotebookLM

1. **Upload Sources:** In NotebookLM, create a new notebook titled **"Verity — AI Voice Interview Bot (BNB Hackathon)"**.
2. **Add Files:** Upload all markdown files from the `docs/` folder:
   * `01_EXECUTIVE_SUMMARY_AND_VISION.md`
   * `02_PROBLEM_STATEMENT_AND_MARKET_FAILURE.md`
   * `03_SYSTEM_ARCHITECTURE_AND_DUPLEX_ENGINEERING.md`
   * `04_CORE_ALGORITHMS_AND_MATHEMATICAL_MODELS.md`
   * `05_RECEIPTS_DOSSIER_AND_HASH_CHAINED_AUDIT.md`
   * `06_PRIVACY_FIRST_INTEGRITY_AND_AUTHENTICITY.md`
   * `07_FEASIBILITY_UNIT_ECONOMICS_AND_ROADMAP.md`
   * `08_APPLE_HIG_DESIGN_SYSTEM_AND_SLIDE_BLUEPRINT.md`
3. **Run the Master Prompt:** Paste the prompt below into the NotebookLM chat window.

---

```markdown
# MASTER PROMPT FOR NOTEBOOKLM: GENERATE APPLE-KEYNOTE PRESENTATION

You are the Principal Presentation Architect and Chief Product Officer at Apple, delivering an iconic keynote presentation for "VERITY" (formerly SocraticHire) at the prestigious BNB International Hackathon in the AI/ML Track.

You have access to the complete technical specifications, market research, mathematical models, and architectural blueprints across the uploaded source documents.

Your objective is to generate the final, high-impact, Apple HIG-compliant presentation deck strictly following the 9-slide official format of "BNB-IDEA-Presentation-Format.pptx".

---

## 🎨 DESIGN & VOICE INSTRUCTIONS (APPLE HIG PHILOSOPHY)

1. **Aesthetic Tone:** 
   - Minimalist, confident, human-centered, and surgically precise. Think Steve Jobs introducing the iPhone or Craig Federighi unveiling Apple Silicon.
   - No buzzword soup, no generic marketing hype, and NO WALLS OF TEXT.
   - Use high typographic contrast: massive bold headlines, sparse and punchy sub-points, and generous negative space (≥ 40% breathing room).

2. **Core Product Identity:**
   - Tagline: *"Resumes make claims. Verity checks them, out loud."*
   - Metaphor: Verity is an elite technical detective conducting an investigation, not an automated multiple-choice quiz bot.
   - The Three Hypotheses: Every resume claim is tested against *Owned vs. Contributed vs. Surface*.
   - Output: Recruiters receive an immutable *Dossier of Verifiable Receipts*, not an arbitrary percentage score.

3. **Required Output Structure:**
   For EACH of the 9 official slides, you must output:
   - **Slide Header:** The exact official template title.
   - **Visual Layout & HIG Architecture:** Detailed visual mockup description (colors, dark OLED background `#05070B`, glassmorphic cards, typography, interactive diagrams, and visual hierarchy).
   - **Slide Content:** Headline, key metric or hero badge, and exactly 2–3 crisp, punchy bullet points.
   - **Verbatim Apple Keynote Speaker Script:** Natural, conversational spoken prose with natural pauses, emotional cadence, and punchy transitions.
   - **Judges' Q&A Defense:** The single hardest question judges will ask on this slide and our airtight technical rebuttal based on the source documents.

---

## 📑 THE 9 REQUIRED SLIDES

### SLIDE 1: TITLE & VISION
- **Template Title:** `INTERNATIONAL HACKATHON · TEAM NAME · DOMAIN`
- **Domain:** AI/ML Track — AI-Powered Interview Bot
- **Project Name:** VERITY
- **Hero Element:** The glowing 2D Verity Belief Ring transitioning from Amber to Emerald Green.
- **Goal:** Hook the judges in the first 15 seconds by exposing the fundamental flaw of technical resumes.

### SLIDE 2: PROBLEM STATEMENT AND APPROACH
- **Template Title:** `PROBLEM STATEMENT AND APPROACH`
- **Key Tension:** The "2.5-Second Monologue Trap" of existing asynchronous video bots (54% drop-off) vs. "The Socratic Investigation" (Full-duplex voice, 3 hypotheses, receipts).
- **Contrast:** Quiz vs. Detective; Arbitrary scores vs. Verifiable audio proof.

### SLIDE 3: FEASIBILITY (TECHNICAL, FINANCIAL & OPERATIONAL)
- **Template Title:** `FEASIBILITY`
- **Hero Metrics:** 
  - Technical: `< 600ms Conversational Latency` (Speculative drafting).
  - Financial: `$0.10 per 15-minute interview` (75x cheaper than $7.50 3D avatar cloud GPUs).
  - Operational: `100% Browser-Native` (Zero install, MediaPipe WASM edge vision).

### SLIDE 4: TARGET AUDIENCE
- **Template Title:** `TARGET AUDIENCE`
- **Three Pillars:** Enterprise Tech Recruiters (cut screening by 80%), Campus Placement Cells (screen 5,000 students for $500), and Candidates in Practice Mode (actionable growth feedback without anxiety).

### SLIDE 5: IMPACT & QUANTIFIABLE METRICS
- **Template Title:** `IMPACT`
- **Measurable Proof:** 80% screening hours saved · 54% ──► 4% candidate abandonment drop · 100% audit-defensible hiring decisions compliant with NYC Local Law 144 and EEOC regulations.

### SLIDE 6: NOVELTY AND INNOVATION
- **Template Title:** `NOVELTY AND INNOVATION`
- **Scientific Foundation:** 
  - MIT CSAIL "Battleship" Expected Information Gain (EIG) inquiry policy (ICLR 2026 Oral).
  - Speculative Dual-Drafting (writing Question N+1 during candidate speech to eliminate conversational latency).
  - Dynamic mid-sentence belief ring shifts that lock solid upon speech completion.

### SLIDE 7: USABILITY AND DESIRABILITY
- **Template Title:** `USABILITY AND DESIRABILITY`
- **Visual Proof:** 
  - Live Voice Canvas: Calm OLED space, no uncanny avatars.
  - Recruiter Dossier & Time Scrubber: Scrub back in time to any second of the interview, click any receipt, and hear the exact synchronized 12-second audio proof.

### SLIDE 8: TEAM MEMBERS' CONTRIBUTION
- **Template Title:** `TEAM MEMBERS' CONTRIBUTION`
- **Four Core Pillars:**
  1. The Intelligence Mind (Resume Extractor, MIT Battleship EIG, Bayesian Calibrator).
  2. The Duplex Voice Floor (4-State FSM, Deepgram STT, ElevenLabs Flash TTS, AudioWorklet Barge-in).
  3. Frontend & Case Board (Next.js 16, 2D Belief Rings, Time Scrubber, Dossier).
  4. Privacy-First Integrity & Audit (MediaPipe Saccade WASM, SHA-256 Hash Chain).

### SLIDE 9: THANK YOU & LIVE DEMO INVITATION
- **Template Title:** `THANK YOU`
- **Closing Punchline:** *"The interview was not a questionnaire. It was an investigation."*
- **Call to Action:** Invitation to live duplex voice demonstration.

---

## 🎙️ BONUS: NOTEBOOKLM AUDIO OVERVIEW DIRECTIVE

If generating an **Audio Overview (Podcast)** from these sources:
- Have the two hosts adopt the persona of two senior Silicon Valley engineering leads discussing an astonishing new open-source breakthrough.
- Highlight the contrast between the misery of talking to an asynchronous timer and the magic of having an AI interviewer that listens, pre-drafts, and swings its belief ring mid-sentence.
- Ensure they explain why "Contributed" is a respectable outcome and how Verity kills the cheating copilot industry with deep Socratic counterfactual probing.
```

---

## 💡 Pro-Tips for Presenting to Judges

* **Keep the 1-Line North Star:** When judges interrupt, anchor back to: *"We don't score people; we verify claims with audio receipts."*
* **Emphasize Unit Economics:** Judges love seeing a $0.10 API architecture beating a $7.50 cloud GPU avatar bot.
* **Lead with the Demo Moment:** Mention the mid-sentence ring shift within the first 60 seconds of the presentation.
