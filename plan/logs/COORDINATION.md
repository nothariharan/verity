# Coordination board

Every agent reads this before editing. Claim paths before you touch them; release when done. Questions go here instead of guessing.

## Rules
- Commit by explicit path only. Never `git add -A` / `git add .`.
- `git pull --rebase` before `git push`.
- Don't edit a path another agent has claimed. Ask below.
- Shared files (`AGENTS.md`, `plan/00-product/DECISIONS.md`, `packages/contracts/**`) get a notice line under "Shared-file changes".
- Do not commit to `main`. Each lane commits and pushes only its own branch, from its own worktree. Merge into `integrate/product` when the sync agent asks. `main` stays the last snapshot that was already on GitHub.

## Branches
| Branch | Worktree | Owns |
|---|---|---|
| `lane/listening` | `C:\Users\HARIHARAN\Desktop\verity-lanes\listening` | Scribe STT, turn endpointing |
| `lane/speaking` | `C:\Users\HARIHARAN\Desktop\verity-lanes\speaking` | Flash TTS, speech normalization |
| `lane/ledger` | `C:\Users\HARIHARAN\Desktop\verity-lanes\ledger` | Consistency ledger |
| `lane/floor` | `C:\Users\HARIHARAN\Desktop\verity-lanes\floor` | Mic, playback, echo, focus, devices |
| `integrate/product` | `C:\Users\HARIHARAN\Desktop\BnB` | Session, engine wiring, app, interview UI |

Work only inside your worktree. Do not edit another lane's files to "make it compile". If you need a contract or a shared file, write the diff under Open questions and stop.

## Path ownership
| Paths | Owner | Status | Since |
|---|---|---|---|
| `research/**`, `monitor_research.py`, `docs/**` | research agent | active | 2026-09-26 |
| `apps/server/src/providers/stt/**`, `apps/server/src/session/turns.ts`, `apps/server/tests/unit/turns.test.ts` | listening agent | active | 2026-09-26 |
| `apps/server/src/providers/tts/**`, `apps/server/tests/unit/tts-normalize.test.ts` | speaking agent | active | 2026-09-26 |
| `apps/server/src/mind/ledger.ts`, `apps/server/tests/unit/ledger.test.ts` | ledger agent | active | 2026-09-26 |
| `apps/web/lib/audio/**`, `apps/web/lib/integrity/**`, `apps/server/src/integrity/**`, `apps/server/tests/unit/integrity.test.ts` | floor agent | active | 2026-09-26 |
| `apps/server/src/mind/engine.ts`, `apps/server/src/wiring.ts`, `apps/server/src/app.ts`, `apps/server/src/session/session.ts`, `apps/server/src/session/hub.ts`, `apps/server/src/providers/speech.ts`, `packages/contracts/**`, `apps/web/components/room/**`, `apps/web/app/**` | sync agent (parent) | active | 2026-09-26 |

Do not edit a path you do not own. If you need a contract change, write the exact zod diff under Open questions and stop. Do not commit.

## Open questions
_None yet. Format: `- [date] [from] question — answer:`_

## Handoffs
- 2026-09-26 build agent → human: manual voice tests (`plan/07-testing/VOICE_TEST_SCRIPT.md`) need a person with a headset once P3–P5 are in.

## Shared-file changes
- 2026-09-26 build agent: added ADR-016..019 to `DECISIONS.md` (ElevenLabs Scribe STT, Gemini→OpenAI fallback, integrity signal changes, light design + FluidOrb + landing/dashboards).
- 2026-09-26 build agent: `AGENTS.md` stack section updated to match ADR-016/017; coordination rule added.
