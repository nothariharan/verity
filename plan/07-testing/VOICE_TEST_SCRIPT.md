# Manual Voice Test Script

Run on the **demo laptop**, **demo headset**, **demo network** (or hotspot). Log pass/fail per row in `logs/VERIFICATION_LOG.md`.

| # | Scenario | Do this | Expect |
|---|---|---|---|
| V1 | Normal turn | Answer, then stop | Verity's next question starts; `eot_to_audio` logged |
| V2 | Thinking pause | "We chose FAISS because…" pause 2 s, continue | No end of turn during the pause |
| V3 | Short answer | "Yes." then silence | ~1.5 s hold, then the turn ends |
| V4 | Real interruption | While Verity speaks: "Sorry, can I add something?" | Instant duck, full stop ≤ 150 ms after yield, Verity listens |
| V5 | Non-interruptions | While Verity speaks: "mm-hm", a cough, a desk tap | At most a brief duck; Verity continues |
| V6 | Self-echo | Laptop speakers, no headset, stay silent | Verity never yields to itself |
| V7 | Long answer | Speak 25 s with natural pauses | One ack clip; the turn stays yours |
| V8 | Interruption kept | Interrupt with a real answer mid-question | The next question responds to it, no verbatim repeat |
| V9 | Ring moves live | Give the demo strong answer | Ring shifts toward Owned (dashed) before you finish, locks after |
| V10 | Buzzwords | "Kafka, Kubernetes, microservices, scalable" | No move toward Owned |
| V11 | Resume after early EOT | Pause as if done, then continue | No question starts; the pre-open is discarded |
| V12 | Reconcile | State 10M/day, later "peak 100 per second" | A polite reconcile question within the next two turns |
| V13 | STT outage | Disable the STT key mid-session | Text mode banner; the interview continues typed |
| V14 | TTS outage | Disable the TTS key | Question shows as text + chime |
| V15 | Network blip | Wi-Fi off 3 s | Reconnects; board identical; continues |
