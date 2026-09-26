# Dashboards

Both use the reference window style: left sidebar, warm canvas, white cards, hairline borders. Demo mode has no auth; a role switch in the header goes to `/app` (hiring team) or `/me` (candidate). Data comes from event logs through the same reducer the live board uses: fixtures in `apps/web/lib/fixtures/` first, then live server events (P1/P2).

## Recruiter `/app`
- **Interviews** (`/app`): table of sessions with candidate, role, status (Live / Completed / Scheduled), per-case mini rings, counts (Owned · Contributed · Surface · Open). **No score column.**
- **New interview** (`/app/new`): resume + JD upload, duration, mode, "use demo candidate"; after extraction, cases appear with priors; copy candidate link.
- **Live** (`/app/live/[id]`): case board: case grid with belief rings (deterministic layout), NOW panel (active case, question kind, why, tied pair), receipts stream, live transcript, observation rail.
- **Dossier** (`/app/dossier/[id]`): header counts + record-intact status, time scrubber, case cards with receipts and clip playback, role coverage, observations with disclaimer.

## Candidate `/me`
- **Home** (`/me`): practice sessions, depth by skill across sessions, "where to go deeper" list (Open/Surface cases with the question to prepare for).
- **Start practice** (`/me/new`): resume + target role/JD → opens `/interview/[id]`.
- **Report** (`/me/report/[id]`): practice-mode dossier, growth framing, same receipts.

## Candidate interview `/interview/[id]`
Consent card → centered `VoiceOrb`, current question under it, two caption lines, floor pill (Listening · Verity speaking · You're speaking), timer, **Type instead**. The candidate never sees beliefs or the board.

## Sidebar (both)
Logo · section links · a small "Demo data" badge whenever the view is fed by fixtures (honesty rule).
