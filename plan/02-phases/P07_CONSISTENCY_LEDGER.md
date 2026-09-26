# P7 — Consistency ledger

**Status:** todo · **Time box:** 3–4 h · **Depends on:** P6

## Goal
Facts are recorded from the resume and answers; suspected conflicts trigger a polite reconcile question; only an unresolved reconcile sets a conflict flag. Implements `04-intelligence/CONSISTENCY_LEDGER.md`.

## In scope
- Fact extraction (from assessor output) + resume metric seeding.
- Deterministic numeric/unit rules; same-attribute checks; optional LLM pair check.
- The policy schedules `reconcile`; resolution → `CONFLICT_RESOLVED` / `CONFLICT_CONFIRMED`.
- Board: rose notch + conflict receipts; dossier shows both quotes side by side.

## Tests
- Unit: rules table (10M/day vs 100/s peak → suspect; 10M/day vs 400/s peak → fine; "we later moved to 48 partitions" → no suspect).
- Integration: the scripted conflict → reconcile question asked → an explained answer resolves it; an unexplained answer confirms it.
- Invariant: no `CONFLICT_CONFIRMED` without a prior reconcile.
- Wording check: reconcile questions contain no accusatory terms.

## Verification gate
- [ ] Rules tests green; the integration scenario passes both branches
- [ ] Manual: a spoken inconsistent pair triggers a natural reconcile question (recording saved)
