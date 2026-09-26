# LLM Evals

Cases live in `apps/server/tests/evals/{role}/*.json`; run with `pnpm eval`. Scorers are code. Log every run (prompt version, model, score) in `logs/VERIFICATION_LOG.md`. A change that drops below its pass line is reverted.

## Extractor
- Set: demo resume, junior resume, vague resume × two JDs.
- Checks: every `sourceSpan` is an exact substring; ≥ 8 cases on the demo resume; the three hero cases are in the top 5; priors ordered sensibly (the specific "designed" line has higher `owned` than the vague line); no invented facts (manual review of 10).
- **Pass:** 100% span validity, hero cases in the top 5.

## Assessor (the most important eval)
≥ 18 labeled cases. Each label = the expected *direction* (which hypothesis should gain most) and constraints.
| Category | Example | Expected |
|---|---|---|
| Specific personal decision | "I keyed by user_id with murmur3 because…" | owned gains most |
| Team did it, no personal role | "The platform team set up partitioning" | contributed gains most |
| Textbook | "Kafka partitions allow parallelism" | surface gains most |
| Buzzword list | "Kafka, K8s, microservices, scalable" | surface or no gain; never owned |
| Non-answer | "I don't remember the details" | all ratings = 3 (no change) |
| Nervous but correct | fillers, restarts, correct specifics | owned gains most |
| Non-native phrasing, correct | grammatical errors, correct specifics | owned gains most |
| Failure story | "our first design lagged because…" | owned gains most |
| Counterfactual strong | a correct "what breaks at 3×" | owned gains most |
| Facts extraction | numbers with units | facts parsed correctly |
- **Pass:** ≥ 16/18 directions correct; non-answer 100%; nervous/non-native 100%; quotes 100% substrings.

## Live evaluator
- 12 partial answers (6 strong so far, 3 generic, 3 buzzword lists).
- **Pass:** ≥ 5/6 strong produce evidence; 0/3 buzzword lists produce evidence.

## Drafter
- 12 situations covering every kind, interruption, and reconcile.
- Code checks: one sentence, ≤ 28 words, ≤ 1 "?", kind respected, not a near-duplicate of an asked question (similarity ≥ 0.85 fails), reconcile contains no accusatory words.
- Human rating 1–5: "would this separate someone who did the work from someone who didn't?" Average ≥ 4.
- Latency p95 logged for `MODEL_DRAFTER`.

## Branch agreement (P6)
Replay 20 recorded turns: how often the early branch pick equals the pick from the final assessment. **Pass:** ≥ 80%.
