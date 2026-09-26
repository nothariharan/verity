# Test Strategy

## Principles
1. **Offline by default.** Fake STT/TTS/LLM make every flow deterministic and keyless.
2. **Events are the test surface.** Integration tests assert event sequences plus the invariants in `CONTRACTS.md`.
3. **Math is unit-tested; judgment is evaluated.** Belief updates, policy, ledger rules, and layout get exact tests. LLM behavior gets labeled evals with pass lines.
4. **Voice is proven by measurement and a script.** Latency harness + `VOICE_TEST_SCRIPT.md`.
5. **The rehearsal is the final test.**

## Levels
| Level | Tool | Where | When |
|---|---|---|---|
| Unit | vitest | `packages/*/test`, `apps/*/tests/unit` | every change |
| Contract | vitest (zod parse of fixtures, JSON Schema snapshot) | `packages/contracts/test` | every change |
| Integration | vitest + real Fastify instance + WS client, `PROVIDERS=fake` | `apps/server/tests/integration` | every change |
| E2E | Playwright, text mode, fake providers | `apps/web/tests/e2e` | before a phase is verified |
| Evals | vitest `--project eval`, real LLMs | `apps/server/tests/evals` | on prompt/model change |
| Latency | `pnpm latency` (real providers, pre-recorded answers) | `apps/server/tests/latency` | P4, P5, P6, P10 on the demo laptop |
| Manual voice | `VOICE_TEST_SCRIPT.md` | — | P3, P5, P10 |
| Rehearsal | `DEMO_REHEARSAL.md` | — | P10 ×2, P11 |

## Fakes
- **FakeLlm:** returns fixtures by `(prompt, scenario)`; supports injected delay, timeout, malformed JSON.
- **FakeStt:** plays a script of words with timings against the session clock, including turn events and speech that overlaps Verity's audio.
- **FakeTts:** paced PCM chunks with a configurable first-chunk delay; honors context close.
- **Browser double:** the integration WS client sends `VAD` / `PLAYBACK` like the real browser.

## Automatic invariant checks
After every integration test, `assertInvariants(events)` runs the six invariants from `CONTRACTS.md` plus: chain verifies; beliefs are floored at ≥ 0.03; no question text > 28 words.

## Fault injection
STT drop → text mode · TTS 429 → text + chime · drafter delay → fallback question · assessor timeout → provisional kept, retried · WS drop → replay · event tamper → dossier banner.

## Latency harness
Plays pre-recorded answers (`fixtures/audio/`) into the real pipeline for N turns, collects `LATENCY_SAMPLE` events, and prints p50/p95 per segment as a markdown table with machine, network, provider region, and date. Paste it into `logs/VERIFICATION_LOG.md`.

## Must-have unit coverage
`belief.ts`, `policy.ts`, `ledger.ts` rules, `chain.ts`, `voice-fsm.ts`, `echo-guard.ts`, `turns.ts` fallback rules, `layout.ts`, the store reducer, `dossier/build.ts`, clip window math.
