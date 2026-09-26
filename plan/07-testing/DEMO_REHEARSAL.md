# Demo Rehearsal Checklist

Two clean runs in a row before P10 is verified. Time each one.

## T−30 min
- [ ] Laptop on power; notifications and updates off
- [ ] Headset selected for input and output; mic level checked
- [ ] Venue Wi-Fi tested; phone hotspot ready
- [ ] `pnpm dev` from the release commit; `/v1/health` all green
- [ ] Credits checked: ElevenLabs characters, Deepgram minutes, LLM quota
- [ ] Window 1 (laptop): `/interview/[id]`. Window 2 (projector): `/board/[id]`
- [ ] Demo candidate loaded; hero cases present: *Kafka · 50k ev/s*, *RAG · 100k docs*, *40% latency cut*
- [ ] Backup recording on the desktop, plays offline
- [ ] The presenter knows where "Type instead" is

## Run sheet
| Time | Beat | Pass |
|---|---|---|
| 0:00–0:25 | Hook | |
| 0:25–0:50 | Resume in → rings appear with priors | |
| 0:50–1:40 | Opening on Kafka → vague answer → ring barely moves → **ownership probe** on the same case, NOW panel shows the tied pair | |
| 1:40–2:30 | Specific answer → ring swings to Owned **mid-sentence**, locks; "prepared while you were speaking" | |
| 2:30–2:55 | Presenter interrupts Verity mid-question → it stops instantly and listens | |
| 2:55–3:40 | End → dossier → scrub back to the Kafka moment → click the receipt → clip plays | |
| 3:40–4:00 | Close | |

## After each run
- [ ] ≤ 4:00 total
- [ ] Glitches filed with `templates/BUG_REPORT_TEMPLATE.md`
- [ ] Latency samples pasted into VERIFICATION_LOG

## Live abort rules
- Voice misbehaves twice → "Type instead" and say "same engine, typed".
- App unrecoverable → play the backup recording, then Q&A.
