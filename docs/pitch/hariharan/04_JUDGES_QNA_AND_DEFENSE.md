# Hariharan's Q&A Defense — The 8 Toughest Systems & Architecture Questions

> **Audience:** Hariharan  
> **Location:** `docs/pitch/hariharan/04_JUDGES_QNA_AND_DEFENSE.md`  
> **Purpose:** Pocket cheat sheet for the toughest questions judges might ask you about system architecture, latency, audio pipelines, privacy, compliance, and unit economics.

---

### Q1: "Why didn't you just use OpenAI's Realtime Speech-to-Speech API?"
* **Your Answer:**  
  > *"Because speech-to-speech models decide their own words inside neural weights on the fly. You cannot commit the question as plain text before speaking, and you cannot mathematically audit why an assessment changed.  
  > Under Verity, our planner commits the exact question text to an immutable SHA-256 event log before audio synthesis begins. Beliefs move strictly from text transcripts—never from vocal pitch, cadence, or accent. That gives us 100% legal auditability under NYC Local Law 144, which black-box speech models fundamentally cannot provide."*

---

### Q2: "How can you claim sub-600ms latency when LLMs take 1,200ms to generate text?"
* **Your Answer:**  
  > *"Because we decoupled the Voice Floor from the Intelligence Mind using Speculative Dual-Drafting.  
  > While the candidate is speaking, our server continuously maintains two candidate follow-ups in the background: Draft A (if they prove ownership) and Draft B (if they are vague).  
  > When the candidate finishes speaking, Question N+1 is already written in server RAM. We select the winning branch in 0 milliseconds and stream audio from a pre-warmed ElevenLabs Flash WebSocket in under 220 milliseconds."*

---

### Q3: "How does your smart barge-in work if the candidate interrupts Verity mid-question?"
* **Your Answer:**  
  > *"We execute barge-in at the client hardware layer in our browser AudioWorklet, not through a slow server round-trip.  
  > The worklet runs a local VAD with an 80ms vocal energy window. If the candidate speaks, the worklet zeroes playback gain in under 20 milliseconds and flushes the audio playback buffer instantly. Simultaneously, an event notifies our Fastify server to terminate the downstream ElevenLabs stream and log `VERITY_AUDIO_INTERRUPTED`."*

---

### Q4: "Why did you build a 2D Case Board instead of a 3D animated video avatar like other startups?"
* **Your Answer:**  
  > *"Two reasons: candidate psychology and unit economics.  
  > First, research shows synthetic 3D talking heads trigger the uncanny valley, increase candidate anxiety, and cause a 54% abandonment rate.  
  > Second, rendering real-time WebRTC 3D video streams on cloud GPU servers costs $0.50 per minute—that's $7.50 for a 15-minute screen! Verity runs on pure edge and API streaming, costing just 10 cents per interview. That is a 75x cost advantage."*

---

### Q5: "What if a candidate looks at a second monitor or phone while answering?"
* **Your Answer:**  
  > *"We observe this through browser-native behavioral telemetry without installing invasive spyware.  
  > MediaPipe FaceLandmarker runs in client WebAssembly and performs an FFT on horizontal iris coordinates. Looking away while thinking has zero penalty. But reading text streaming off an auxiliary monitor creates an unmistakable periodic sawtooth wave (slow drift for 2 seconds, rapid 80ms return flick).  
  > We log this as an objective, timestamped observation on the recruiter timeline—never an automated disqualification."*

---

### Q6: "How does your SHA-256 hash chain prove compliance with NYC Local Law 144 and EEOC regulations?"
* **Your Answer:**  
  > *"NYC Local Law 144 strictly penalizes automated hiring tools that make black-box, unexplainable decisions.  
  > Verity outputs zero arbitrary numerical scores. Instead, we produce an immutable Dossier of Verifiable Receipts—exact transcript quotes, 12-second audio clips, and belief deltas. Every single event is cryptographically sealed in an append-only SHA-256 hash chain. If anyone tampers with a candidate's transcript or score post-interview, the cryptographic chain immediately breaks at that sequence number."*

---

### Q7: "What is your unit economics model? How do you get 10 cents per interview?"
* **Your Answer:**  
  > *"For a full 15-minute technical interview:  
  > Deepgram streaming STT costs $0.065 ($0.0043/min);  
  > ElevenLabs Flash TTS costs $0.016 (~1,600 characters of bot speech);  
  > Groq / Llama-3.3-70B inference costs $0.015 (~25k tokens);  
  > And our MediaPipe computer vision costs $0.00 because it runs on the candidate's local CPU via WebAssembly.  
  > Total: 9.6 cents per interview—enabling companies to screen 10,000 university applicants for less than $1,000."*

---

### Q8: "How does this system scale to 10,000 concurrent interviews?"
* **Your Answer:**  
  > *"Because our architecture is stateless and GPU-free. Competitors rendering 3D video streams hit a hard GPU concurrency ceiling and require expensive multi-instance clusters.  
  > Verity's server is a lightweight Fastify Node.js WebSocket gateway that handles audio chunk routing. The heavy lifting is handled by globally distributed edge APIs (Deepgram and ElevenLabs) and client-side WebAssembly. A single standard cloud instance can easily support thousands of concurrent WebSocket duplex connections."*
