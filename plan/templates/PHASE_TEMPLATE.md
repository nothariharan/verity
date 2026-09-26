# P{N} — {Phase name}

**Status:** todo | in-progress | verified | cut
**Owner:** {name}
**Time box:** {hours}
**Depends on:** P{N-1} verified

## Goal
{One sentence: what is true when this phase is done.}

## Why it matters for the demo
{Which demo beat this enables.}

## In scope
- {item}

## Out of scope (do not build here)
- {item}

## Tasks
- [ ] {task} — {file/area}

## Contracts touched
{Types/events/WS messages added or changed. Update CONTRACTS.md in the same change.}

## Tests to add
- Unit: {…}
- Contract: {…}
- Integration (fake providers): {…}
- Eval / manual: {…}

## Verification gate
All must be true, with evidence logged in `plan/logs/VERIFICATION_LOG.md`:
- [ ] {observable, checkable statement}
- [ ] Regression sweep passes (`07-testing/VERIFICATION_GATES.md`)

## Risks and fallbacks
| Risk | Fallback |
|---|---|

## Notes / decisions made during the phase
{Link ADRs added.}
