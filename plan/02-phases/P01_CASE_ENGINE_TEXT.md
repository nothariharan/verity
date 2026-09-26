# P1 — Case engine (text mode)

**Status:** todo · **Time box:** 6–8 h · **Depends on:** P0

## Goal
With typed answers only, Verity extracts cases with priors, asks discriminating questions, rates evidence, updates beliefs with receipts, and follows up on the **same** case with the right kind of question when an answer is vague.

## Why
This is the product. If the text loop is excellent, voice and visuals make it shine. If not, nothing saves it.

## In scope
- PDF/TXT/MD ingest (`unpdf` or `pdf-parse`).
- Extractor (prompt v1) + validation (exact `sourceSpan`) + priors + importance (`CASE_ENGINE.md` §1).
- `belief.ts`: update rule, floors, status derivation, fairness guards.
- `policy.ts`: case value, kind table, session arc, `why` strings.
- Assessor (prompt v1) → receipts → belief updates.
- Drafter in **synchronous** mode (speculation comes in P6).
- Precomputed opening questions as fallback.
- Minimal text UI on `/interview/[id]`: question, answer box, case list with belief numbers.

## Tests
- Unit `belief.ts`: update math (golden values); non-answer moves nothing; floors hold; settle at 0.70; Surface can't settle before a scaffold.
- Unit `policy.ts`: table-driven scenarios for case choice and kind; the arc (reply at 90 s, closing at 20 s).
- Unit: receipt validation rejects quotes not in the transcript.
- Integration (fake LLM): the scripted session `fixtures/demo/script_text.json`: vague → same case with `mechanism`/`ownership`; strong → owned rises ≥ 0.2 with a receipt; "I don't remember" → no belief change, a probe spent.
- Evals (real LLM): extractor + assessor + drafter sets from `07-testing/EVALS.md`.

## Verification gate
- [ ] Unit + integration green
- [ ] Extractor eval: 100% exact spans; the demo's three hero cases are in the top 5
- [ ] Assessor eval: direction correct on ≥ 13/15; non-answer and "nervous but correct" cases pass
- [ ] Drafter eval: 10/10 one sentence ≤ 28 words, kind respected
- [ ] Manual text session on the real LLM (screenshot + event log saved): the vague → same-case follow-up and strong → ring shift both happen
