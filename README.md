# Verity

**Resumes make claims. Verity checks them, out loud.**

Verity is a voice interviewer that treats every resume claim as a case to investigate. Each case holds three competing hypotheses (**owned**, **contributed**, **surface**), and Verity asks the one question that best separates the two currently tied. The belief shifts live while the candidate speaks, and every shift leaves a receipt: the quote, the audio clip, and the reasoning, kept in a tamper-evident record. Recruiters get a dossier of receipts instead of a score.

Built for the BNB International Hackathon, AI/ML track (AI-Powered Interview Bot).

## Status
Planning complete; implementation starts at phase P0. See [`plan/README.md`](plan/README.md) for the build order and status board.

## Start here
- [`AGENTS.md`](AGENTS.md): rules for anyone (human or AI agent) working in this repo
- [`plan/00-product/PRODUCT_SPEC.md`](plan/00-product/PRODUCT_SPEC.md): what Verity is
- [`plan/01-architecture/SYSTEM_ARCHITECTURE.md`](plan/01-architecture/SYSTEM_ARCHITECTURE.md): how it works
- [`plan/02-phases/`](plan/02-phases/): P0 → P11 with verification gates
- [`plan/07-testing/`](plan/07-testing/): how we prove it works

## Stack (planned)
Next.js (latest) · Node + Fastify WebSockets · zod contracts · Drizzle + SQLite · Deepgram streaming STT · ElevenLabs Flash v2.5 TTS · fast LLMs via Groq

`research/` and `MASTER_AI_INTERVIEW_BOT_BLUEPRINT.md` are early brainstorming under a previous working name, kept for reference.
