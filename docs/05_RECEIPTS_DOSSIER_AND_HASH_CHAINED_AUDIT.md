# 05 — Receipts Dossier, Time Scrubber & Hash-Chained Audit Trail

> **Target Platform:** Verity (formerly SocraticHire)  
> **Hackathon Track:** AI/ML Track — Problem Statement: AI-Powered Interview Bot  
> **Core Deliverable:** The Recruiter Dossier & The Interactive Time Scrubber  
> **Source Document:** Curated for NotebookLM Ingestion & Recruiter/Candidate Experience

---

## 1. The Core Philosophy: "Receipts, Not Numbers"

In conventional hiring tools, recruiters are given a single reductive metric:
$$\text{Applicant Match Score: } 74\%$$

When a hiring manager asks, *"Why did this candidate fail?"*, the recruiter cannot answer. The score is a statistical abstraction derived from uninspectable embeddings.

**Verity abolishes arbitrary scores in favor of Receipts.**

A receipt is an immutable, timestamped evidentiary bundle linking a specific spoken claim directly to its underlying audio proof, rationale, and mathematical belief shift.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ANATOMY OF A VERITY RECEIPT                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ RECEIPT #08 · CASE: DISTRIBUTED CACHE REPLICATION                           │
│ Timestamp: 08m:42s · Turn #14                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ❝ QUOTE:                                                                    │
│   "...when we saw cross-region write amplification, we switched from        │
│    sync replication to Raft leader leasing with a 200ms heartbeat."         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 💡 TECHNICAL RATIONALE:                                                     │
│   Candidate cited internal Raft leader lease parameter (200ms) to          │
│   mitigate write amplification, demonstrating direct operational ownership. │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📈 BELIEF SHIFT:                                                            │
│   Owned: 42% ──► 88% (+46%)   |   Contributed: 38% ──► 10%                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🔊 AUDIO PROOF:                                                             │
│   [ ▶ PLAY CLIP (08:42 - 08:56) ] [ 14.2s ] ── Synchronized Waveform        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cryptographic Security: The Append-Only Hash Chain

To ensure enterprise compliance and eliminate accusations of post-hoc algorithmic tampering, every state change in Verity is written to an **append-only, hash-chained event log**.

### The Cryptographic Formula:
For event at sequence $n$:
$$\text{Hash}_n = \text{SHA-256}\Big( n \;\|\; \text{SessionID} \;\|\; \text{EventType} \;\|\; \text{Timestamp} \;\|\; \text{JSON}(\text{Payload}) \;\|\; \text{Hash}_{n-1} \Big)$$

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Event #00   │      │  Event #01   │      │  Event #02   │
│ SESSION_INIT │───►  │ CLAIM_PARSED │───►  │ RECEIPT_01   │
│ Hash: 0x8F4A │      │ Prev: 0x8F4A │      │ Prev: 0x3C1B │
│              │      │ Hash: 0x3C1B │      │ Hash: 0x9E7D │
└──────────────┘      └──────────────┘      └──────────────┘
```

### Why This Matters to Enterprise Talent Leaders:
* **Tamper-Evident Guarantees:** If a malicious recruiter or unauthorized admin attempts to modify a candidate's transcript, adjust a score, or delete an integrity note, **the hash chain immediately breaks at that sequence number**.
* **Audit-Defensible Compliance:** Complete compliance with NYC Local Law 144 and EEOC audit requirements. Enterprise HR teams can export the raw cryptographic proof log for external audits.

---

## 3. The Recruiter Dossier Experience

The Recruiter Dossier is rendered in Apple HIG dark-mode minimalism, presenting a complete forensic picture of the interview:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  VERITY DOSSIER · ALEX CHEN · SENIOR DISTRIBUTED SYSTEMS ENGINEER           │
│  Session: #VR-9082 · Date: Sep 26, 2026 · Duration: 18m:14s                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  CASE SUMMARY (8 CASES INVESTIGATED)                                        │
│  [●] Kafka Failover Architecture    ──► OWNED       (92% Conf, 3 Receipts) │
│  [●] Redis Cluster Migration        ──► OWNED       (88% Conf, 2 Receipts) │
│  [●] Kubernetes Ingress Controller  ──► CONTRIBUTED (74% Conf, 2 Receipts) │
│  [●] DynamoDB Global Tables         ──► CONTRIBUTED (68% Conf, 1 Receipt)  │
│  [○] WebRTC Media Gateway           ──► SURFACE     (81% Conf, 2 Receipts) │
├─────────────────────────────────────────────────────────────────────────────┤
│  EVIDENTIARY TIMELINE & TIME SCRUBBER                                       │
│  00:00 ───────[●]───────────[●]───────────[●]───────────[●]──────── 18:14   │
│               R#1           R#2           R#3           R#4                 │
│               Kafka         Redis         K8s           WebRTC              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Recruiter Capabilities:
1. **The Interactive Time Scrubber:**
   * Recruiters can scrub the timeline slider back to any second of the interview.
   * **State Travel:** The 2D Case Board instantly reconstructs its exact visual state at that timestamp, showing how the belief rings evolved in response to each question.
2. **One-Click Audio Playback:**
   * Clicking any receipt plays the precise 10–15 second audio snippet with real-time word-by-word karaoke highlighting. Recruiters hear the candidate's exact inflection, technical vocabulary, and certainty.
3. **Role Coverage Matrix:**
   * Maps investigated resume claims against the company's specific Job Description requirements, revealing gaps that were not covered.

---

## 4. The Candidate Practice Report & "Right of Reply"

Verity is designed to elevate candidates, not punish them. In practice / mock-interview mode, candidates receive a **Constructive Growth Dossier**:

### Constructive Feedback Highlights:
* **The "Owned" Breakthroughs:** Highlights the exact technical explanations where the candidate demonstrated world-class mastery.
* **The "Surface" Coaching Moments:** Points to moments where the candidate gave textbook definitions instead of concrete operational details:
  * *"Tip on Case #04 (WebRTC): When asked about packet loss handling, you described jitter buffers in the abstract. Practice explaining which specific congestion control algorithm (e.g. GCC vs. BBR) you configured."*

### The "Right of Reply" Invariant:
In high-stakes recruiting rounds, if a candidate feels an answer was misunderstood due to conversational time limits, Verity provides a **Right of Reply**:
* Candidates can record a 90-second asynchronous voice addendum or write a technical clarification on settled cases.
* The addendum is attached directly to the Dossier as an appended event, preserving candidate dignity and fairness.
