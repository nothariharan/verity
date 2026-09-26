# Progress Log

Newest at the bottom. Format:
`YYYY-MM-DD HH:MM — who — phase — what changed — next — faked/seeded — blocked`

---

2026-09-26 10:40 — agent — plan — Wrote the Verity plan from scratch: three-hypothesis case engine, discriminating question policy, speculative drafting, consistency ledger, receipts with hash-chained log and time scrubber, duplex floor, P0–P11 with gates, testing, demo, deck. Repo initialized and pushed to github.com/nothariharan/verity. — next: P0 foundations — faked: none — blocked: team names; Deepgram, ElevenLabs, Groq keys
2026-09-26 11:00 — build agent — plan — Providers switched: ElevenLabs Scribe v2 Realtime STT + Flash v2.5 TTS, Gemini primary / OpenAI fallback (ADR-016/017); integrity changes (ADR-018); light warm design + FluidOrb + landing/dashboards (ADR-019); COORDINATION.md added. — next: P0 — faked: none — blocked: none
2026-09-26 11:30 — build agent — P0 — pnpm monorepo, zod contracts + shared reducer, hash-chained libSQL event log, provider interfaces + fakes, Gemini→OpenAI fallback, Fastify WS with replay, CI workflow; web design system, FluidOrb (verbatim) + interview room in the reference layout, recruiter `/app` and student `/me` dashboards, dossier with scrubber. — next: P1 case engine; landing page (subagent) — faked: **dashboards and `/app/live/demo`, `/interview/demo`, dossier `demo` render a scripted event log (`apps/web/lib/fixtures/demo.ts`, candidate "Priya Raman"; demo interview list names are fictional); every such view shows a "Demo data" badge; demo orb level is synthetic** — blocked: local `.env` has `OPENAI_MODEL=luna`, needs `gpt-6-luna`
