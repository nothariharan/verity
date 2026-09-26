# Demo Script — 4 minutes

Projector: `/board/[id]`. Presenter: headset, `/interview/[id]` on the laptop.

**[0:00–0:25] Hook**
"A resume is a list of claims. Today's interview bots read a question bank at you, and a copilot on a second screen can answer any of it. Verity does something different: it investigates the claims."

**[0:25–0:50] Cases appear**
Load the demo candidate. Rings appear, each one a claim, each split three ways: **owned**, **contributed**, **surface**. "Every claim starts as an open case. The ring is Verity's current belief."

**[0:50–1:40] Vague answer → the right follow-up**
Verity: "Let's start with your Kafka pipeline. At fifty thousand events a second, how did you keep consumers from falling behind?"
Presenter (vague): "We used consumer groups and scaled up workers when it got slow."
The ring barely moves. The NOW panel: *owned vs contributed still tied*.
Verity: "Which part of that scaling setup was your call, and what did you weigh it against?"
"It didn't move on to the next topic. It asked the question that separates *did it* from *was near it*."

**[1:40–2:30] Specific answer → the ring moves while talking**
Presenter explains: keyed by user ID, murmur3, 12 partitions, one tenant created a hot partition, they salted that key, and lag alerts on p99.
Mid-sentence the ring swings toward Owned (dashed), then locks solid. A receipt slides in. NOW panel: *next question prepared while you were speaking*.

**[2:30–2:55] Interruption**
Verity starts a counterfactual; the presenter cuts in: "Actually, one more thing on the hot key…" Verity stops instantly and listens.

**[2:55–3:40] Receipts**
End. The dossier: Owned 1 · Contributed 1 · Open 1, no overall score, "Record intact". Drag the time scrubber back to the Kafka moment; the board rewinds. Click the receipt: the clip plays, the quote highlights, belief before → after.

**[3:40–4:00] Close**
"Every judgment Verity makes comes with a receipt. Resumes make claims. Verity checks them, out loud."

## Q&A prep
- **Why not a speech-to-speech model?** It would choose what to say. Our investigation must choose, and stay in text so every answer can move a case and be audited. We copied the duplex behavior, not the brain.
- **Can buzzwords game it?** Buzzword lists are rated as surface evidence; the next question asks for mechanism or ownership.
- **What if someone forgets?** Non-answers move nothing. A case can end Open, which isn't a negative verdict.
- **Is this fair to nervous or non-native speakers?** Fluency, fillers, and accent aren't evidence; our evals test exactly those cases.
- **Integrity?** Neutral observations only, disclosed up front, camera processing on-device and off by default.
- **Latency and cost?** Only the numbers in our verification log.
