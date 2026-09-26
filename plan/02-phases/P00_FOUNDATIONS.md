# P0 — Foundations

**Status:** todo · **Time box:** 3–4 h · **Depends on:** —

## Goal
An empty but real product skeleton: monorepo, zod contracts, hash-chained event log with projections and replay, provider interfaces with Fakes, the WS session round-trip, CI.

## In scope
- pnpm workspace: `apps/web` (`create-next-app@latest`, TS, Tailwind, App Router), `apps/server` (Fastify + `@fastify/websocket`, tsx for dev), `packages/contracts` (zod).
- Contracts v1 for everything in `CONTRACTS.md` + JSON Schema export for LLM outputs.
- `log/event-log.ts` (append in a transaction), `chain.ts` (hash + verify), `projections.ts`, `rebuild.ts`. Drizzle schema + migrations (libSQL).
- `providers/{stt,tts,llm}` interfaces + Fakes (scriptable, deterministic, injectable delays/failures).
- WS: `HELLO` (replay after `lastSeq`), `START`, `TEXT_ANSWER`, `END`; the web store reducer + socket with reconnect.
- Root scripts, `.env.example`, `.gitignore`, a GitHub Actions workflow running `pnpm test`.

## Out of scope
Any intelligence, UI beyond a debug page, audio.

## Tasks
- [ ] Workspace + tooling (TS strict, eslint, prettier, vitest)
- [ ] `packages/contracts` schemas + tests
- [ ] Event log + chain + projections + rebuild
- [ ] Provider interfaces + Fakes
- [ ] WS gateway + web socket client + reducer
- [ ] Debug page `/debug/[id]` streaming raw events
- [ ] CI workflow

## Tests
- Unit: chain verify passes; tampering with any payload fails verification at that seq.
- Unit: reducer applies an event fixture → the expected state; duplicate seqs ignored.
- Integration: create session → WS `HELLO` → `START` → `TEXT_ANSWER` echo event → reconnect with `lastSeq` receives only newer events.
- Property: `rebuild(events) == live projections` for a random event sequence.

## Verification gate
- [ ] `pnpm test` green locally and in CI
- [ ] Chain tamper test fails at the right seq
- [ ] Reconnect-replay test passes
- [ ] `pnpm dev:fake` boots web + server with no keys
