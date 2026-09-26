# Glossary

| Term | Meaning |
|---|---|
| **Case** | One investigable resume claim, e.g. "Kafka pipeline at 50k events/s". |
| **Hypotheses** | `owned`, `contributed`, `surface`, the three explanations Verity weighs for every case. |
| **Belief** | Probabilities over the three hypotheses for a case; sums to 1. Shown as a three-segment ring. |
| **Prior** | Starting belief from the resume line's specificity. |
| **Likelihood rating** | The assessor's 1–5 rating of how expected the new evidence is under each hypothesis. |
| **Settled** | One hypothesis ≥ 0.70. Status `SETTLED_OWNED` / `SETTLED_CONTRIBUTED` / `SETTLED_SURFACE`. |
| **Open** | Probe budget spent without settling. Not a negative verdict. |
| **Provisional** | A live, mid-answer belief nudge, drawn dashed; confirmed or corrected at turn end. |
| **Question kind** | `opening`, `ownership`, `mechanism`, `counterfactual`, `scaffold`, `reconcile`, `reply` (right of reply), `closing`. |
| **Tied pair** | The two hypotheses with the smallest gap; decides the question kind. |
| **Draft A / Draft B** | Speculative next questions for "strong" and "weak" outcomes of the current answer. |
| **Receipt** | Evidence record: question, quote, clip window, type, rationale, belief before/after. |
| **Fact** | An atomic statement in the consistency ledger (entity, attribute, value, unit, quote). |
| **Suspected conflict** | Two facts that may disagree; triggers a reconcile question. |
| **CONFLICT flag** | Set only after an unresolved reconcile; shows both quotes. |
| **Turn** | One candidate answer, bounded by end-of-turn detection. |
| **Early end-of-turn** | STT signal that the turn is probably ending; used to pick a draft and pre-open TTS. |
| **Voice states** | `LISTEN`, `ACK`, `SPEAK`, `YIELD`. |
| **Duck** | Instantly lowering Verity's playback volume on candidate speech, before a yield is confirmed. |
| **Session clock** | ms since `SESSION_STARTED` on the server's monotonic clock; every timestamp uses it. |
| **Chain** | Hash chain over the event log (`prevHash` → `hash`). |
| **Time scrubber** | Dossier control that replays the board at any session time. |
| **Right of reply** | Final invitation to add evidence to the most important Open case. |
| **Observation** | A neutral, timestamped integrity event. Never a score. |
| **Lens** | The optional 3D interviewer presence (P11). |
