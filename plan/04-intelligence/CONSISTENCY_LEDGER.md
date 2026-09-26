# Consistency Ledger

A running list of atomic **facts** the candidate states: `(entity, attribute, value, unit, quote, atMs)`, e.g. `(ingest pipeline, throughput_daily, 10000000, events/day)`.

## Extraction
The assessor also returns `facts[]` for the turn (same call, no extra latency). Resume metrics are seeded as facts with `quote = sourceSpan`.

## Conflict checks (deterministic first)
1. **Unit-normalized numeric rules** (same entity or case):
   - daily ↔ per-second: `daily / 86400` vs stated peak; if average > peak → suspect.
   - percentages above 100 where impossible; before/after that don't match a stated % change (±15% tolerance).
   - team size, duration, dates: overlapping or impossible timelines.
2. **Same attribute, different value** (e.g. partitions 12 vs 48) → suspect, unless the candidate framed a change over time ("we later went to 48").
3. **Optional LLM check** only for same-entity *non-numeric* pairs the rules flag as related (e.g. "managed Kafka" vs "we ran our own brokers"). Output: `conflict | compatible | unclear`. Only `conflict` suspects.

## Flow
`CONFLICT_SUSPECTED` → the policy schedules a `reconcile` question citing both statements neutrally → the next answer is assessed:
- explained (rounding, change over time, different systems) → `CONFLICT_RESOLVED`, a receipt of type `decision`/`metric` as appropriate;
- not explained → `CONFLICT_CONFIRMED`, the case gets `conflict: true`, a `conflict` receipt holding both quotes.
A confirmed conflict never auto-settles a case as Surface. It is shown next to the belief as its own flag for the recruiter to judge.

## Wording rules
Reconcile questions are curious, not accusatory: "Help me square…", "Earlier you mentioned … and just now … how do those fit together?" Never "you said something inconsistent".
