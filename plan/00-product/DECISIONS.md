# Decisions (ADR log)

Locked unless superseded by a new ADR (`../templates/ADR_TEMPLATE.md`). Never edit an accepted ADR; add a new one.

---

## ADR-001 — Product name is Verity; one product, one hero moment
**Status:** Accepted · 2026-09-26
Verity is the only product. The hero moment is a case ring moving mid-answer, locking, and replaying as a receipt. Every other feature supports that moment or is cut.

## ADR-002 — Three-hypothesis belief per case instead of a single state
**Status:** Accepted
**Decision:** Each case carries `belief = {owned, contributed, surface}` (sums to 1). The assessor returns per-hypothesis **likelihood ratings** (1–5) for the new evidence. Code performs the update `b' ∝ b · L` with a temperature to stop over-confident jumps. Displayed status is derived: `SETTLED_OWNED` / `SETTLED_CONTRIBUTED` / `SETTLED_SURFACE` at ≥ 0.70, otherwise `INVESTIGATING` or `OPEN` (budget spent).
**Why:** A single "supported / weak" label forces a binary honest-vs-fake judgment. Three hypotheses are fairer ("contributed" is legitimate), they make question choice principled (separate the tied pair), and they're still legible as one ring.
**Alternatives:** Five-state label (less principled, invites "liar" framing); full particle filter (illegible, slow to build).

## ADR-003 — The planner owns the words; speech models are only the behavior reference
**Status:** Accepted
Full-duplex speech research (Moshi, SALMONN-omni, LLaMA-Omni 2) defines the behavior we want: always listening, text ahead of audio, natural overlap, explicit listen/speak/acknowledge/yield decisions. None of them runs in Verity. The investigation must stay in text so every answer can move a case and every word is auditable.

## ADR-004 — TypeScript end to end
**Status:** Accepted
**Decision:** `apps/web` is Next.js latest (16.3+, App Router, Tailwind). `apps/server` is a Node 22+ Fastify server with `@fastify/websocket` for the realtime session. `packages/contracts` holds zod schemas, which generate TS types and the JSON Schemas used for LLM structured output.
**Why:** One language removes the contract-mirroring tax, lets the whole team read every file, and all our providers have first-class JS SDKs. WebSockets need a long-lived server, so realtime doesn't go in Next route handlers.

## ADR-005 — STT: Deepgram streaming, Flux preferred
**Status:** Accepted (verify in P3)
**Decision:** Use Deepgram's conversational streaming model (Flux) for its model-integrated end-of-turn signals, including an early/"eager" end-of-turn and turn-resumed events. Fallback: Nova-3 streaming with our endpointing and hold rules. Keyterm boosting uses terms from the resume.
**Why:** Semantic turn detection is the hardest part of natural turn-taking, and early end-of-turn events are exactly what speculative drafting needs.
**Revisit if:** Flux is unavailable on our plan or measured worse on our test script than Nova-3 + rules.

## ADR-006 — TTS: ElevenLabs Flash v2.5 over the multi-context WebSocket
**Status:** Accepted
**Decision:** `eleven_flash_v2_5`, one context per question, closed on barge-in. One calm, professional voice chosen in P4 and recorded here. Not the Conversational Agents product; not v3 / Multilingual v2 live.
**Why:** It's built for streamed text with low time-to-first-audio, and closing a context is a clean barge-in path.
**Revisit if:** p95 first-audio on our network is > 400 ms after tuning.

## ADR-007 — Commit before speak; clause streaming optional
**Status:** Accepted
The full question (one sentence, ≤ 28 words) is committed as an event, then sent to TTS. Clause-level streaming (`TTS_CLAUSE_STREAMING`) is allowed if latency needs it; the committed text is always the full sentence.

## ADR-008 — Speculative drafting
**Status:** Accepted
**Decision:** During a candidate turn, the drafter keeps two drafts current, built from the interim transcript: **A** for "evidence strong → move on or counterfactual" and **B** for "evidence weak → same case, discriminating probe". On early end-of-turn, the provisional belief picks a branch and the TTS context is pre-opened (not played). On the final end-of-turn, the chosen draft is committed and played. If the turn resumes, discard. If the final assessment contradicts the branch choice before audio starts, re-pick.
**Why:** It removes the planner from the critical path. Turn-end-to-voice becomes roughly end-of-turn detection + TTS first audio.

## ADR-009 — Hash-chained append-only event log
**Status:** Accepted
Every event stores `hash = sha256(prevHash + canonicalJSON(event))`. Projections (cases, receipts, transcript) are rebuilt from events. The dossier shows "record intact" if the chain verifies. It's cheap, and a credible answer to "could this record be edited?"

## ADR-010 — Barge-in is two-stage and the browser owns the cutoff
**Status:** Accepted
Browser VAD **ducks** playback immediately on candidate speech. The server confirms a real clause (≥ 3 non-filler words, passes the echo guard) and sends `YIELD`, and the browser stops and flushes. The server closes the TTS context. Headphones on stage; `echoCancellation` always on.

## ADR-011 — Acknowledgements are local clips
**Status:** Accepted
"mm-hm", "right", "go on", "got it" are pre-generated once in the interviewer voice and played by the browser. They never call TTS live and never take the turn.

## ADR-012 — Contradictions require a reconcile attempt
**Status:** Accepted
The consistency ledger may *suspect* a conflict (numeric/unit checks, same-entity statement comparison). A suspected conflict triggers a reconcile question. Only an unresolved reconcile sets the `CONFLICT` flag on the case, with both quotes as receipts.

## ADR-013 — Integrity is observational and local-first
**Status:** Accepted
Focus, timing, second voice, and optional MediaPipe gaze (on-device only, calibrated, off by default). No aggregate score, no accusatory wording.

## ADR-014 — LLM roles and models live in config
**Status:** Accepted
Roles: **extractor** (strongest structured model, once), **assessor** (fast, turn end), **live evaluator** (fast, mid-turn), **drafter** (fast, mid-turn), **summarizer** (optional, post-session). Default fast host: Groq (current fastest strong open model). All roles use JSON-schema output from zod. Model IDs live in `.env`, never in code.

## ADR-015 — 3D is last and optional
**Status:** Accepted
P11 "Lens": an abstract 3D presence on the candidate screen driven by voice state and the active case's belief. Behind `NEXT_PUBLIC_ENABLE_LENS`, default off. The case board stays 2D. No human avatar.

## ADR-016 — STT: ElevenLabs Scribe v2 Realtime (supersedes ADR-005)
**Status:** Accepted · 2026-09-26 (verify in P3)
**Decision:** Streaming STT is ElevenLabs Scribe v2 Realtime over WebSocket from the server. Turn detection is primarily ours: silence endpointing + hold rules (trailing conjunctions, fillers, mid-number) from `VOICE_SPEC.md`, using partial/committed transcripts from Scribe. Keyterms from the resume are passed if supported. Behind the `SttProvider` interface with a Fake.
**Why:** The team measured it as more natural and fast on our voices, and one vendor for STT + TTS simplifies keys and latency debugging.
**Trade-off:** No model-level eager end-of-turn event; speculative drafting uses our own early-EOT (short silence threshold) instead.
**Revisit if:** p95 final-transcript lag on the voice script is > 500 ms.

## ADR-017 — LLM: Gemini primary, OpenAI fallback (supersedes the host choice in ADR-014)
**Status:** Accepted · 2026-09-26
**Decision:** All LLM roles call Gemini via `@google/genai` with a JSON schema generated from zod. The same request falls back once to OpenAI (`openai` SDK, structured outputs) on timeout, 5xx, 429, or schema validation failure. Models come from `GEMINI_MODEL` / `OPENAI_MODEL` with optional per-role `MODEL_<ROLE>` overrides. Every call logs provider, model, latency, and whether fallback fired.
**Why:** Keys the team already has, strong structured output, and a working fallback path for stage reliability.

## ADR-018 — Integrity signal adjustments
**Status:** Accepted · 2026-09-26
**Decision:** (1) "Second voice" becomes an experimental overlap heuristic (speech detected while the candidate transcript is idle, or two concurrent energy sources), since streaming STT gives no diarization; off by default. (2) Add `VIRTUAL_AUDIO_DEVICE` and `VIRTUAL_CAMERA` observations, derived from `enumerateDevices()` labels matching known virtual-device names. All remain neutral, timestamped observations; no score.
**Source:** `research/10_ADVANCED_ANTI_CHEAT_AND_AUTHENTICITY_FACTORS.md` (reference only).

## ADR-019 — Light warm design system, FluidOrb presence, landing + dashboards
**Status:** Accepted · 2026-09-26
**Decision:** The whole product uses a light, warm "forensic case file" system (off-white `#F8F6F2`, ink `#111`, hairline `#E5E1DA`, white floating cards), replacing the dark theme in `SCREENS.md`. The candidate presence is the provided **FluidOrb** WebGL component (shader unmodified) wrapped by `VoiceOrb` for state and level. P11 Lens becomes an optional upgrade on top of it. Scope adds a marketing landing page (`/`), a recruiter dashboard (`/app`), and a student practice dashboard (`/me`); demo mode has no auth (role switch). Landing copy maps "claim states" onto the real model: Owned / Contributed / Surface / Open.
**Why:** Matches the reference visuals, keeps the audit-first product legible for judges, and the orb gives the voice interview a clear, non-human presence.
