# Integrity — observations, not accusations

The best integrity feature is the questioning: ownership, mechanism, and counterfactual questions about the candidate's *own* system are hard to outsource in real time. Observations add context for a human. They never judge.

## Principles
1. No score, probability, rank, or "flagged" status.
2. Neutral wording: "Tab not focused · 4.2 s during Q3", never "suspicious".
3. Heavy debouncing; glancing away while thinking is normal, especially for neurodivergent candidates.
4. Camera processing happens on-device; frames never leave the browser. Camera signals are off by default.
5. Disclosed before the interview; the disclaimer is shown wherever observations appear.

## Signals (build order)
| # | Kind | Source | Rule |
|---|---|---|---|
| 1 | `FOCUS_LOST` / `FOCUS_RETURNED` | `visibilitychange`, window blur/focus | emit if ≥ 1.5 s; attach the current question |
| 2 | `SILENCE_THEN_FLUENT` | server turn timing | ≥ 6 s silence after a question, then ≥ 25 words with near-zero fillers and a flat speaking rate. Recorded as a timing note only |
| 3 | `SECOND_VOICE_POSSIBLE` | STT diarization | a second speaker for ≥ 2 s of speech, echo-guarded |
| 4 (opt.) | `GAZE_AWAY` | MediaPipe FaceLandmarker, on-device, 8–10 fps | calibrated iris offset outside the range for ≥ 2 s with a steady head (reading pattern) |
| 4 (opt.) | `HEAD_DOWN` | head pose | pitch below baseline −15° for ≥ 2.5 s |
| 4 (opt.) | `EXTRA_FACE` | face count | ≥ 2 faces for ≥ 1.5 s |
| — | `CAMERA_OFF` | permissions | recorded once; carries no weight |

## Calibration (gaze only)
5 seconds before starting: look at the center dot, then the four corners. No calibration → gaze disabled.

## Stage rule
Demo the focus observation (reliable). Show gaze only if it passed a rehearsal under venue-like lighting.

## Copy lint
A test greps integrity UI strings for `cheat|suspicious|score|probability|flagged|fraud` and fails if any appear.
