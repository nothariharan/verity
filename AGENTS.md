# AGENTS.md — Rules for any agent working on Verity

Read this whole file before touching the repo. It applies to every agent and every model (Claude, GPT, Gemini, Grok, Composer, local models) and to humans.

---

## 1. What Verity is

**Verity is a voice interviewer that investigates resume claims like a detective, not a quiz.**

Every substantive claim on a resume becomes a **case**. Each case holds three competing hypotheses:

| Hypothesis | Meaning |
|---|---|
| **Owned** | The candidate built or owned it and can explain decisions, trade-offs, and failures |
| **Contributed** | They worked on part of it or used it under someone else's design |
| **Surface** | They know the vocabulary, not the work |

Verity keeps a belief over those three for every case, picks the case where one question would move that belief most, and asks the question that best **separates the two hypotheses that are currently tied**. The candidate answers out loud. The belief ring on the case shifts *while they speak*, then settles when their turn ends. Every shift leaves a **receipt**: the quote, the audio clip, the rationale, and the belief before and after. The recruiter gets a dossier of receipts, not a score.

> **Resumes make claims. Verity checks them, out loud.**

The one demo moment that must work: **a case ring swings toward "Owned" while the candidate is mid-sentence, locks green when they finish, and in the dossier a click on that receipt plays the exact clip.**

---

## 2. Source of truth (in order)

1. `AGENTS.md`: hard rules (this file)
2. `plan/00-product/DECISIONS.md`: locked decisions (ADRs)
3. `packages/contracts` (zod schemas) and `plan/01-architecture/CONTRACTS.md`
4. The current phase file in `plan/02-phases/`
5. Area specs: `03-voice`, `04-intelligence`, `05-frontend`, `06-integrity`
6. `plan/07-testing/`: how to prove it works

`research/` and `docs/reference/MASTER_AI_INTERVIEW_BOT_BLUEPRINT.md` are early brainstorming under an old working name. They are **reference only**, and they contain rejected ideas and unverified numbers. If they disagree with `plan/`, `plan/` wins.

---

## 3. Hard rules

### Product
- **Verity's planner writes every word the interviewer says.** No speech-to-speech model or hosted "conversational agent" may decide the next utterance.
- A question is **one spoken sentence aimed at one case**. It is committed to the event log *before* audio is generated.
- Beliefs change **only from text**: committed questions and candidate transcripts. Never from audio features, tone, accent, pace, or face.
- **Forgetting is not lying.** "I don't remember" moves nothing toward Surface by itself and never creates a contradiction.
- A **contradiction** needs two cited statements that conflict, plus one polite reconcile question that didn't resolve it. Only then may a case carry the `CONFLICT` flag.
- Every belief change and verdict links to receipt IDs. No receipt, no change.
- **No cheating score, probability, or rank.** Integrity signals are neutral, timestamped observations.
- "Contributed" is a respectable outcome. Copy must never frame it as failure.

### Stack (see DECISIONS.md)
- **TypeScript end to end.** Next.js latest stable (16.3+, App Router) in `apps/web`. Node realtime server (Fastify + WebSocket) in `apps/server`. Zod schemas in `packages/contracts` are the single source of truth for types, events, and LLM output schemas.
- STT: **ElevenLabs Scribe v2 Realtime** (streaming), with our own endpointing and hold rules for turn detection (ADR-016). TTS: **ElevenLabs `eleven_flash_v2_5` over WebSocket**. Both sit behind provider interfaces with Fakes.
- LLM: **Gemini** (`@google/genai`) primary, **OpenAI** fallback on timeout/5xx/429/schema failure (ADR-017). Model IDs come from `.env`.
- UI: light warm design system; the candidate presence is the provided `FluidOrb` (ADR-019).
- Storage: SQLite (libSQL) via Drizzle locally; Postgres-compatible schema. **Append-only, hash-chained event log** is the source of truth.
- **Banned:** speech-to-speech models in the live path, ElevenLabs Conversational Agents, Eleven v3 / Multilingual v2 for live speech, graph databases, vector databases, Redis/Kafka/Temporal, agent frameworks and swarms, and any facial-emotion or voice-tone analysis.

### Engineering
- **Contracts first.** Change the zod schema, then everything that uses it, then `CONTRACTS.md`, all in the same change.
- **Everything runs offline** with Fake STT/TTS/LLM (`PROVIDERS=fake`). Text mode (typed answers) must always drive the same engine; it is the stage fallback.
- API keys live only on the server. `.env.example` stays current. Never commit secrets.
- The live case board is **2D, ≤ 12 cases visible**, with a deterministic layout (no force simulation).
- Don't build a later phase's features until the current phase's verification gate passes.

### Honesty
- **No unmeasured number** goes into the UI, docs, deck, or pitch. Measure it, log it in `plan/logs/VERIFICATION_LOG.md`, then quote it. External research is cited only by title and link, and only after someone has read it.
- Never say something works without gate evidence (test output, screenshot, latency table).
- Anything seeded or faked for the demo is written in `plan/logs/PROGRESS.md`.

---

## 4. Workflow for every task
0. Read `plan/logs/COORDINATION.md`. Claim the paths you'll edit; post questions there. Commit by explicit path only.
1. Read `plan/README.md` and find the current phase. Read that phase file.
2. For non-trivial work, write a spec from `plan/templates/FEATURE_SPEC_TEMPLATE.md`.
3. Build the smallest thing that meets the phase goal. Match the surrounding style.
4. Add tests (`plan/07-testing/TEST_STRATEGY.md`) and run them.
5. Walk the phase's verification gate; log the evidence with `plan/templates/VERIFICATION_REPORT_TEMPLATE.md`.
6. Append to `plan/logs/PROGRESS.md`.
7. Record real architectural choices as ADRs (`plan/templates/ADR_TEMPLATE.md`).

## 5. Definition of done
- [ ] Zod contracts and `CONTRACTS.md` match the code
- [ ] `pnpm test` green (unit + contract + integration with fakes)
- [ ] Works end to end in text mode with `PROVIDERS=fake`
- [ ] Phase gate items checked, with evidence logged
- [ ] No secrets, no banned dependencies
- [ ] `PROGRESS.md` updated

## 6. Commands (fill in as the repo is scaffolded)
```bash
pnpm install
pnpm dev            # web :3000 + server :8787, PROVIDERS from .env
pnpm dev:fake       # everything offline
pnpm test           # vitest across packages
pnpm test:e2e       # playwright, text mode, fake providers
pnpm eval           # LLM evals against real models
pnpm latency        # latency harness against real providers
```

## 7. When unsure
Protect the demo moment (ring swings mid-answer → locks → receipt plays). Between equal options, choose the simpler. If a rule blocks you, stop and ask a human.
