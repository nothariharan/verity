# Verification Gates

A phase is `verified` only when every gate item in its phase file passes **and** the regression sweep passes, with evidence in `logs/VERIFICATION_LOG.md` (`templates/VERIFICATION_REPORT_TEMPLATE.md`).

## What counts as evidence
| Claim | Evidence |
|---|---|
| Tests pass | Command + result line |
| Looks right | Screenshot or recording in `plan/logs/evidence/` |
| Fast enough | Latency table: p50/p95, N, machine, network, date |
| LLM does X | Eval run: prompt version, model, score |
| Voice behaves | `VOICE_TEST_SCRIPT.md` rows with results |
"I tried it and it worked" is not evidence.

## Regression sweep
1. `pnpm test` green.
2. `pnpm test:e2e` green (text mode, fakes).
3. 2-minute text session on the real LLM: one case shifts with a receipt.
4. From P4: one spoken round trip on real providers.
5. From P8: dossier opens, one clip plays, chain intact.

## Gate summary
| Phase | Core gate |
|---|---|
| P0 | Chain tamper detection, reconnect replay, `dev:fake` boots |
| P1 | Evals pass; vague → same case with the right kind; non-answer moves nothing |
| P2 | Ring tweens ≤ 300 ms after an event; nodes never move; a newcomer reads the board in 20 s |
| P3 | Thinking pause holds; provisional ring moves mid-answer; buzzwords don't |
| P4 | Exact text spoken; TTS first audio p95 ≤ 400 ms |
| P5 | 10/10 interrupts stop, 0/10 fillers do; no self-yield |
| P6 | Draft ready ≥ 90%; branch agreement ≥ 80%; eot→audio p50 ≤ 900 ms |
| P7 | Reconcile before any conflict flag; both branches pass |
| P8 | Clips correct; scrubber matches live; tamper banner shows |
| P9 | Focus reliable; copy lint; gaze validated or off |
| P10 | Two clean rehearsals; fallbacks drilled; numbers traced |
| P11 | fps and underrun check; a clean rehearsal with the Lens, else off |

## Honesty gate (P10)
Every number in the deck, pitch, README, or UI appears in `08-demo-and-pitch/DECK_PLAN.md` → "Numbers we can say" with a link to its log entry or a read citation.
