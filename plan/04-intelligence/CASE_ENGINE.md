# Case Engine — beliefs, receipts, question policy

The engine is mostly **deterministic code**. LLMs do three narrow jobs: extract cases, rate evidence, and write one sentence. Code decides which case, which kind, and how much belief moves. That split is what makes Verity explainable.

## 1. Extraction (setup, once)
Input: resume text, JD text. Output (zod `ExtractionResult`):
- `skills[]` from the JD: name, importance 0..1, required/preferred.
- `cases[]` from the resume: claim, label (≤ 28 chars), `sourceSpan` (**must be an exact substring**; code rejects otherwise), technologies, metrics, skillIds, `roleRelevance` 0..1, `specificity` 0..1, `ownershipLanguage` ("led/designed/built" = 1, "worked on/helped" = 0.5, none = 0), `openingQuestion`.
- `keyterms[]` for STT boosting.
Code computes `importance = roleRelevance × (0.5 + 0.5·specificity)`, keeps the top **12** as visible cases, and computes the prior.

### Prior
```
owned       = 0.20 + 0.25·specificity + 0.10·ownershipLanguage
surface     = 0.35 − 0.25·specificity
contributed = 1 − owned − surface
```
(Clamp each to ≥ 0.10, renormalize.) A crisp, metric-heavy "designed X" line starts around 0.55 / 0.35 / 0.10; a vague line around 0.20 / 0.45 / 0.35.

## 2. Belief update
The assessor rates each new piece of evidence with `likelihood ∈ {1..5}` per hypothesis ("how expected is this answer if H were true?"). Code converts and updates:
```
w_h   = exp(λ · (r_h − 3))          λ = 0.6   (r=5 → ×3.3, r=1 → ×0.3)
post  ∝ b_h · w_h
b'    = (1 − η)·b + η·normalize(post)   η = 0.8 final, 0.5 provisional
b'    = floor each at 0.03, renormalize   # nothing is ever certain
```
Multiple receipts in one turn are applied in order; each receipt stores `before`/`after`.
**Provisional updates are not cumulative.** The live view is always `base belief ⊕ current provisional receipt`. At end of turn the final receipts replace it, starting from the base.

### Status
- `SETTLED_<H>` when `b_H ≥ 0.70`.
- `OPEN` when `probes ≥ probeBudget` (default 3; +1 allowed for reconcile, +1 for right of reply) without settling.
- `INVESTIGATING` otherwise once asked; `UNTOUCHED` before the first question.

### Fairness guards (code-enforced)
- `non_answer` evidence ("I don't remember", silence, off-topic) is capped at `r = 3` for all hypotheses, so it moves nothing. It only spends a probe.
- Fluency, fillers, grammar, and accent are not evidence. The assessor prompt says so; evals test it.
- A `SETTLED_SURFACE` case always gets its scaffold question first. Surface can only settle after a scaffold.

## 3. Question policy (code)
### Which case
```
value(c) = importance(c) · uncertainty(c) · timeFit(c) · fatigue(c) · continuity(c) · conflictBoost(c)
uncertainty  = entropy(b_c) / ln 3                  # 1 = fully unsure, 0 = certain
timeFit      = 1 if remaining ≥ 150 s, else (c is active ? 1 : 0.2)
fatigue      = 1 if probes < budget, else 0
continuity   = 1.3 if c is active and the last receipt on c was vague/non_answer, else 1
conflictBoost= 1.6 if c has an unresolved CONFLICT_SUSPECTED, else 1
```
Settled cases score 0, **except** one `counterfactual` is allowed when `b_owned ≥ 0.70`, `importance ≥ 0.8`, and none has been asked. That's the depth check that shows a strong candidate's ceiling.

### Which kind
| Condition (first match wins) | Kind |
|---|---|
| First question on this case | `opening` |
| Unresolved suspected conflict | `reconcile` |
| `b_surface` is top and no scaffold asked yet | `scaffold` |
| `b_owned ≥ 0.60` | `counterfactual` |
| Top two = owned & contributed | `ownership` |
| Top two include surface | `mechanism` |

The `why` string shown on the board is templated from these facts, e.g. *"Kafka · 50k ev/s: high role importance; owned vs contributed still tied (0.41 / 0.38)."*

### Session arc
| Time left | Behavior |
|---|---|
| Start | One-line greeting (fixed text) + `opening` on the top case |
| ≥ 150 s | Normal policy |
| < 150 s | Stay on the active case or pick only high-value Open cases |
| 90 s | `reply` (right of reply) on the highest-importance Open/Investigating case |
| 20 s | `closing` (fixed text: thanks + what happens next) |
| 0 | End session |

## 4. Receipts
The assessor returns evidence items. Code validates each (quote substring, type allowed, ratings in range), computes the clip window from word timings, applies the update, and emits `RECEIPT_CREATED` then `BELIEF_UPDATED`. A turn with no usable evidence emits a single `non_answer` receipt (so the record shows the question was asked and answered).

## 5. Role coverage (dossier)
Per JD skill: **Required → Claimed (cases linked) → Settled (best status among its cases)**. Required skills with no cases are "not claimed". If time allows, the policy may ask one `mechanism` question on the top unclaimed required skill (as a synthetic case marked `source: jd`).

## 6. Knowledge depth (dossier)
Per case: depth 0 untouched · 1 surface/open · 2 contributed or owned without counterfactual · 3 owned **and** a strong counterfactual answer. Label: "Depth shown in this interview".
