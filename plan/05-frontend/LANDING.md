# Landing page `/`

Minimal, editorial, Apple/Butter-style typography. One idea per section. References: butter.video (inline animated icon tiles in headlines), thewone.co (progressive workflow), project-one (composition), intercom (clear nav + one CTA), and the Verity hero mock.

## Rules
- Warm off-white canvas, ink text, white floating artifact cards. No logo strips, stock photos, gradient blobs, or feature-card grids.
- Every headline may carry **one** inline icon tile (1em rounded square, SVG, own loop animation).
- Scroll storytelling with GSAP ScrollTrigger; at most three pinned sections. `prefers-reduced-motion` shows static frames.
- Copy never names vendors and never quotes an unmeasured number. No "score".
- Claim states on the page are the real model: **Owned / Contributed / Surface / Open**.

## Inline icon tiles
`resume` (highlight sweep) · `wave` (bar pulse) · `ring` (belief ring filling) · `ask` (bubble typing dots) · `receipt` (check stamp) · `lens` (magnifier scan) · `shield` (observation tick).

## Sections
1. **Nav**: Verity · How it works · For teams · For candidates · Dashboard (demo) · **Start an interview**.
2. **Hero**: "Interviews [lens] that investigate." Sub: "Verity turns a resume into a live investigation: adaptive questions, evidence you can replay, and no black-box score." CTAs: Start an interview / See a dossier. Centered product window (sidebar · case graph · transcript) running an ~8 s scripted loop: question → streamed answer → ring swings to Owned → "Case settled · Owned". Floating artifacts with numbered steps 1–4: Resume claim, Verity question, Evidence clip, Case settled.
3. **Problem**: "Resumes tell you what candidates [resume] claim. Interviews should tell you what they understand."
4. **How it works (pinned)**: one line of resume becomes a case; the case gets a question; the answer moves the ring; the ring leaves a receipt. Scroll drives the step.
5. **Live investigation**: "The question changes with the [ask] answer." Board fragment with the tied pair and "why this question".
6. **Voice**: "It feels like a [wave] conversation. It thinks like an investigation." VoiceOrb demo with floor states.
7. **Receipts**: "Every assessment has a [receipt] receipt." Quote + clip + before → after.
8. **Resolution**: "Claims don't get scores. They get [ring] resolved." Four cards for Owned / Contributed / Surface / Open, with plain explanations ("Contributed is a respectable outcome").
9. **Trust**: "Trust without [shield] surveillance." Neutral observation timeline + disclaimer.
10. **Audiences**: For hiring teams / For candidates (practice mode).
11. **Dossier preview**: "Everything the interview established."
12. **Final CTA**: "Stop interviewing resumes. Start investigating candidates."

## Gate
Playwright: all sections render; nav anchors work; reduced-motion run shows static frames. Screenshots in `plan/logs/evidence/`. Lighthouse desktop performance logged (target ≥ 90).
