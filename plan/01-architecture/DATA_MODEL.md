# Data Model

Drizzle ORM on libSQL/SQLite (`apps/server/data/verity.db`). The schema stays Postgres-compatible.

| Table | Columns |
|---|---|
| `events` | `session_id`, `seq`, `type`, `at_ms`, `payload` (json), `prev_hash`, `hash`. **Source of truth, append-only** |
| `sessions` | `id`, `mode`, `role`, `duration_sec`, `text_mode`, `resume_text`, `jd_text`, `status`, `created_at` |
| `skills` | `id`, `session_id`, `name`, `importance`, `requirement` |
| `cases` | `id`, `session_id`, `label`, `claim`, `source_span`, `skill_ids`, `technologies`, `metrics`, `importance`, `prior`, `belief`, `provisional`, `status`, `conflict`, `probes`, `probe_budget`, `opening_question` |
| `questions` | `id`, `session_id`, `case_id`, `kind`, `text`, `why`, `tied_pair`, `anchors`, `branch`, `committed_ms`, `spoken_start_ms`, `spoken_end_ms`, `interrupted_at_char` |
| `segments` | `id`, `session_id`, `speaker`, `text`, `start_ms`, `end_ms`, `final`, `words` |
| `receipts` | `id`, `session_id`, `case_id`, `question_id`, `segment_ids`, `quote`, `clip_start_ms`, `clip_end_ms`, `type`, `likelihood`, `rationale`, `before`, `after`, `conflicts_with` |
| `facts` | `id`, `session_id`, `case_id`, `entity`, `attribute`, `value`, `unit`, `quote`, `at_ms` |
| `observations` | `id`, `session_id`, `kind`, `start_ms`, `end_ms`, `detail`, `during_question_id` |

## Rules
- Write the event and update projections in **one transaction**. `rebuild(sessionId)` from events must equal the live projections (tested).
- Hash: `sha256(prevHash + canonicalJson({seq,type,atMs,payload}))`; the genesis `prevHash` is `sha256(sessionId)`.
- Audio: `data/audio/{sessionId}/candidate.wav` and `verity.wav`, 16 kHz mono PCM, sample 0 = sessionMs 0 (pad silence). Clip window = `[quoteStart − 1500, quoteEnd + 500]` ms, max 20 s.
- The product policy (stated in the dossier footer, not built): audio deleted after 30 days.
