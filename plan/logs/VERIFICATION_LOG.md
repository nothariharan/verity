# Verification Log

Every phase gate, eval run, and latency measurement goes here, using `../templates/VERIFICATION_REPORT_TEMPLATE.md`. Screenshots go in `./evidence/`. Pitch numbers may only come from entries in this file.

---

## 2026-09-26 — P0 Foundations gate
- `pnpm test`: contracts 8/8, server 10/10 green (vitest). Includes: chain verifies; tampering the payload at seq 6 fails verification at seq 6; 25 concurrent appends produce seq 1..25 with a valid chain; invalid payload rejected before write; rebuild-from-storage equals incremental projection (60 random events, seeded); WS create → HELLO → START → TEXT_ANSWER → reconnect with lastSeq receives only newer events; Gemini→OpenAI fallback on schema failure, timeout, and 429.
- `pnpm -r typecheck`: clean (web uses `next typegen && tsc`).
- Boot with no keys: server started with `PROVIDERS=fake` and no env file; `GET /health` → `{"ok":true,"providers":"fake","llm":{"gemini":false,"openai":false},"elevenlabs":false}`. Web dev server (Next 16.3.6) renders `/app/live/demo`.
- Live LLM smoke (one call each, `scripts/llm-smoke.ts`): `gemini-3.5-flash-lite` ok, 1471 ms and 1715 ms on two runs; `gpt-6-luna` ok, 1216 ms. `OPENAI_MODEL=luna` (value in local `.env`) returns 404 — must be `gpt-6-luna`. Single samples; not latency claims.
- CI workflow added (`.github/workflows/ci.yml`); first run result to be recorded after push.
