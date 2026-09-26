# Coordination board

Every agent reads this before editing. Claim paths before you touch them; release when done. Questions go here instead of guessing.

## Rules
- Commit by explicit path only. Never `git add -A` / `git add .`.
- `git pull --rebase` before `git push`.
- Don't edit a path another agent has claimed. Ask below.
- Shared files (`AGENTS.md`, `plan/00-product/DECISIONS.md`, `packages/contracts/**`) get a notice line under "Shared-file changes".

## Path ownership
| Paths | Owner | Status | Since |
|---|---|---|---|
| `research/**`, `monitor_research.py`, `docs/**` | research agent | active | 2026-09-26 |
| `apps/**`, `packages/**`, root workspace config (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.github/**`) | build agent (Verity build) | active | 2026-09-26 |
| `plan/**` (except research refs) | build agent | active | 2026-09-26 |

## Open questions
_None yet. Format: `- [date] [from] question — answer:`_

## Handoffs
- 2026-09-26 build agent → human: manual voice tests (`plan/07-testing/VOICE_TEST_SCRIPT.md`) need a person with a headset once P3–P5 are in.

## Shared-file changes
- 2026-09-26 build agent: added ADR-016..019 to `DECISIONS.md` (ElevenLabs Scribe STT, Gemini→OpenAI fallback, integrity signal changes, light design + FluidOrb + landing/dashboards).
- 2026-09-26 build agent: `AGENTS.md` stack section updated to match ADR-016/017; coordination rule added.
