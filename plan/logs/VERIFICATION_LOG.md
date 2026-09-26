# Verification Log

Every phase gate, eval run, and latency measurement goes here, using `../templates/VERIFICATION_REPORT_TEMPLATE.md`. Screenshots go in `./evidence/`. Pitch numbers may only come from entries in this file.

---

## 2026-09-26 — P0 Foundations gate
- `pnpm test`: contracts 8/8, server 10/10 green (vitest). Includes: chain verifies; tampering the payload at seq 6 fails verification at seq 6; 25 concurrent appends produce seq 1..25 with a valid chain; invalid payload rejected before write; rebuild-from-storage equals incremental projection (60 random events, seeded); WS create → HELLO → START → TEXT_ANSWER → reconnect with lastSeq receives only newer events; Gemini→OpenAI fallback on schema failure, timeout, and 429.
- `pnpm -r typecheck`: clean (web uses `next typegen && tsc`).
- Boot with no keys: server started with `PROVIDERS=fake` and no env file; `GET /health` → `{"ok":true,"providers":"fake","llm":{"gemini":false,"openai":false},"elevenlabs":false}`. Web dev server (Next 16.3.6) renders `/app/live/demo`.
- Live LLM smoke (one call each, `scripts/llm-smoke.ts`): `gemini-3.5-flash-lite` ok, 1471 ms and 1715 ms on two runs; `gpt-6-luna` ok, 1216 ms. `OPENAI_MODEL=luna` (value in local `.env`) returns 404 — must be `gpt-6-luna`. Single samples; not latency claims.
- CI workflow added (`.github/workflows/ci.yml`); first run result to be recorded after push.

## 2026-09-26 — Spoken path, clips, and dashboards
**Verifier:** sync agent  **Branch:** `integrate/product` plus `fix/spoken-path` and `fix/evaluator-ui`  **Providers:** fake for unit/integration/Playwright; real ElevenLabs for one Scribe/Flash smoke

| Check | Result | Evidence |
|---|---|---|
| `pnpm test` in `apps/server` | PASS | 56 passed, 1 skipped (Scribe smoke skips when no key is in the environment) |
| Spoken answer on the session socket | PASS | `tests/integration/spoken-loop.test.ts`: PCM frame → `END_OF_TURN` → receipt whose quote contains the spoken words; `candidate.wav` is a RIFF file; `Range` returns 206 for the clip bytes. One-word "Yes." does not end the turn before the 1.5s hold. |
| Clip window math | PASS | `tests/unit/clip-window.test.ts`: 1.5s lead, 0.5s tail, 20s cap, clamped to the session |
| Live server attaches speech | PASS | `tests/unit/boot.test.ts` and `main.ts` passes `speech: wiring.speech` |
| Scribe hears Flash | PASS | `tests/smoke/scribe-roundtrip.test.ts` with local keys: partial transcript matched the spoken sentence before the socket closed. 2.7s for that one run. Not a latency claim. |
| Hiring board, practice board, invite link, demo dossier | PASS | Playwright `apps/web/tests/e2e/dashboards.spec.ts`: 3 passed. Demo dossier still shows "Demo data" and says the scripted log has no audio. |
| Full P1–P10 gates | NOT VERIFIED | Phase files still have open gate items (headset script V1–V15, eval thresholds, right of reply, tamper banner spot-check). Status board stays `todo`. |

**Faked or seeded:** offline tests use Fake STT/TTS/LLM. `/demo` routes still replay `DEMO_EVENTS`. The real smoke used ElevenLabs Scribe and Flash only, not a conversational agent.
**Verdict:** this slice works. The phases are not verified.

