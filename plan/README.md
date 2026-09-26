# Verity — Build Plan

`AGENTS.md` holds the rules. This folder holds the plan. Start with `00-product/PRODUCT_SPEC.md`.

## The idea in four lines
1. Every resume claim becomes a **case** with three hypotheses: **Owned / Contributed / Surface**.
2. Verity asks the one question that best separates the two hypotheses currently tied, on the case where it matters most.
3. While the candidate talks, the case's belief ring moves live, and Verity is already **pre-drafting** its next question for each way the answer could go.
4. Every belief change leaves a **receipt** (quote + clip + rationale) in a hash-chained record, and the dossier can be scrubbed back through time.

## Folder map
| Folder | What's inside |
|---|---|
| `00-product/` | Product spec, locked decisions, glossary |
| `01-architecture/` | System design, contracts, data model, repo layout |
| `02-phases/` | P0 → P11, each with a goal, tasks, tests, and a verification gate |
| `03-voice/` | Duplex voice: listen / acknowledge / speak / yield, STT, TTS, echo, latency |
| `04-intelligence/` | Case engine (belief updates), question policy, speculative drafting, consistency ledger, prompts |
| `05-frontend/` | Screens, the case board, the dossier and time scrubber, design language |
| `06-integrity/` | Observations, not accusations |
| `07-testing/` | Strategy, fakes, evals, the voice script, gates, rehearsal |
| `08-demo-and-pitch/` | Demo script and slide plan for `BNB-IDEA-Presentation-Format.pptx` |
| `templates/` | Phase, feature, ADR, prompt, test plan, verification report, bug |
| `logs/` | `PROGRESS.md`, `VERIFICATION_LOG.md`, `evidence/` |

## Status board
Statuses: `todo` · `in-progress` · `verified` · `cut`

| Phase | Name | Delivers | Status |
|---|---|---|---|
| P0 | Foundations | Monorepo, zod contracts, hash-chained event log, fakes, CI | verified (CI run pending) |
| P1 | Case engine (text) | Claims → cases → belief updates → discriminating questions, typed answers | todo |
| P2 | Case board | Live 2D board with belief rings and receipts panel | todo |
| P3 | Listening | ElevenLabs Scribe streaming, turn rules, live provisional belief | todo |
| P4 | Speaking | ElevenLabs Flash speaks committed questions | todo |
| P5 | Duplex | Barge-in, acknowledgements, echo guard, four-state loop | todo |
| P6 | Speculative drafting | Next question pre-drafted during the answer | todo |
| P7 | Consistency ledger | Fact ledger, conflict detection, reconcile questions | todo |
| P8 | Receipts dossier | Receipts, clips, time scrubber, role coverage, right of reply | todo |
| P9 | Integrity observations | Focus, timing, second voice, optional local gaze | todo |
| P10 | Polish and hardening | Visual polish, fallbacks, rehearsal, deck | todo |
| P11 | **3D Lens (only if time is left)** | 3D interviewer presence | todo |

### Cut lines
- **24-hour build:** P0 → P5, then a minimal P8 (receipts list + clip playback). Skip P6, P7, and P9.
- **48-hour build:** P0 → P10.
- **P11** starts only after P10 is verified with two clean rehearsals.

### Moving a phase to `verified`
All tasks done → every gate item passes → evidence in `logs/VERIFICATION_LOG.md` → regression sweep green (`07-testing/VERIFICATION_GATES.md`).

P1–P10 stay `todo`. The spoken socket, receipt clip range, candidate join link, and dashboard Playwright run are logged in `logs/VERIFICATION_LOG.md`. That is not a full phase gate. P11 stays out.
