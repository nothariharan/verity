# P11 — The Lens (3D, only if time is left)

**Status:** todo · **Time box:** whatever remains; hard stop 3 h before judging · **Depends on:** P10 verified + two clean rehearsals

> Behind `NEXT_PUBLIC_ENABLE_LENS` (default `false`). If it isn't verified 3 hours before judging, it's cut and we ship with the flag off.

## Goal
Replace the 2D presence orb on the candidate screen with **the Lens**: an abstract, glassy 3D object that is clearly *listening*. No face, no avatar.

## Behavior (driven by data we already have)
| Signal | Lens response |
|---|---|
| `LISTEN` + mic level | slow breathing; the surface ripples with the candidate's voice |
| `SPEAK` + Verity audio amplitude | inner light pulses with Verity's speech |
| `ACK` | a small, soft nod-like contraction |
| `YIELD` | quick dim and pull-back, then attentive stillness |
| Active case belief (recruiter preview only) | refraction tint blends owned/contributed/surface colors |

The candidate view shows no belief tint (candidates don't see judgments live). The tint appears only when the Lens is previewed on the board or setup page.

## Stack
`three`, `@react-three/fiber`, `@react-three/drei`; `next/dynamic` with `ssr:false`; `MeshTransmissionMaterial` or a custom shader; audio levels from existing AnalyserNodes. Any model/texture asset goes in `apps/web/public/lens/` (GLB, Draco, < 2 MB). Reference or texture images made with the image-gen MCP go in the same folder.

## Constraints
- ≥ 50 fps p50 on the demo laptop *during a live interview*; auto-fallback to 2D if < 40 fps for 3 s.
- Zero audio underruns in the player while the Lens runs.
- No network calls; `prefers-reduced-motion` → a static render.

## Tests
- Manual: a 5-minute interview with the Lens on: fps log, player underrun counter = 0.
- Toggle: flag off → pixel-identical to the P10 candidate screen.

## Verification gate
- [ ] fps + underrun results logged
- [ ] One clean full rehearsal with the Lens on; otherwise the flag stays off
