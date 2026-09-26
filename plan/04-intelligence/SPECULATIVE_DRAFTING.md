# Speculative Drafting

**Goal:** when the candidate stops talking, Verity's next question already exists. Planner latency leaves the critical path.

## Mechanism
While a candidate turn is in progress, the **Drafter** maintains two drafts:
- **Draft A (strong):** assumes the answer settles or strongly shifts the active case. Target = policy's next choice with the active case's belief set to the provisional belief (often a new case's `opening`, or a `counterfactual`).
- **Draft B (weak):** assumes the answer didn't move much. Target = the same case, kind from the policy with the current base belief (`mechanism` / `ownership` / `scaffold`).

Refresh triggers: a new final segment, or a provisional belief change > 0.10 on any hypothesis. Max one drafter call in flight; drop stale responses (versioned by turn and segment count).

## Commit rules
1. `EARLY_END_OF_TURN` → choose the branch: **A** if the provisional top hypothesis rose ≥ 0.10 during the turn or the case would settle, else **B**. Pre-open a TTS context with the chosen draft (don't play).
2. `TURN_RESUMED` → close the pre-opened context; keep drafting.
3. `END_OF_TURN` → commit the chosen draft (`QUESTION_COMMITTED` with `branch`), play it.
4. Assessor finishes (in parallel). If its final belief would have chosen the **other** branch **and** audio hasn't started, re-pick once. If audio already started, keep going; the next turn corrects course.
5. No draft available → synchronous drafter call with a 2 s timeout → else the case's precomputed `openingQuestion` (`branch: "fallback"`).
6. Reconcile and right-of-reply questions override drafts when their triggers fire.

## Why this is safe
- Drafts are only candidates. Nothing is committed or spoken until end of turn.
- Every committed question still carries `why` and `branch`, so the board can show "prepared while you were speaking".
- Evals measure branch agreement: how often the pre-picked branch matches what the final assessment would choose. Target ≥ 80%.

## Metrics (logged)
`draft_ready_at_eot` (bool), `branch_agreement` (bool), `eot_to_audio_ms`, `drafter_calls_per_turn`.
