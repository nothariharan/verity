# Verity — Product Spec

## One line
**Resumes make claims. Verity checks them, out loud.**

## The problem, precisely
Early screening fails in three ways at once:
1. **Questions aren't about the person.** Generic question banks test whether someone can talk about Kafka, not whether *they* built *their* Kafka pipeline.
2. **Judgments aren't traceable.** A score of 7/10 can't be audited, disputed, or learned from.
3. **Answers can be outsourced.** A copilot on a second screen can answer any generic question well. It can't easily answer "what did *you* decide when your hot partition fell behind?"

## The idea
Treat every resume claim as a **case** and the interview as the investigation.

### Cases and hypotheses
For each case Verity holds a belief over three hypotheses:
- **Owned:** built or owned it; can explain decisions, trade-offs, failures, numbers.
- **Contributed:** real involvement in part of it, or used it inside someone else's design.
- **Surface:** knows the words, not the work.

The prior comes from the resume line (specific metrics and decisions start closer to Owned; vague lines start closer to Surface). Each answer updates the belief. A case **settles** when one hypothesis reaches 0.7, or when its probe budget runs out (then it is **Open**).

### Discriminating questions
The next question targets the case where one question would reduce uncertainty most (weighted by role importance and time left). Its **kind** depends on which two hypotheses are tied:

| Tied hypotheses | Question kind | Example |
|---|---|---|
| Owned vs Contributed | **Ownership probe** | "Which part of that pipeline was your decision, and what did you weigh it against?" |
| Contributed vs Surface | **Mechanism probe** | "Walk me through what happens to one event from producer to consumer in your setup." |
| Owned leading, not settled | **Counterfactual probe** | "If traffic tripled overnight, what would break first in your design?" |
| Surface leading | **Scaffold** (fair second chance) | "Let's narrow it. How did you know the consumers were falling behind?" |
| Two statements conflict | **Reconcile** | "Earlier you said 10 million a day, and a peak of 100 per second. Help me square those." |

This policy is simple enough to explain to a judge in one breath and specific enough to beat a generic copilot.

### Live belief, pre-drafted questions
- While the candidate speaks, a fast evaluator nudges the ring **provisionally** (dashed). At the end of the turn the assessor confirms or corrects it (solid).
- While they speak, Verity also **pre-drafts** the next question for the likely outcomes ("strong" vs "vague"). When the turn ends it picks a branch and speaks almost immediately.

### Receipts
Every belief change creates a receipt: the question, the quote, the clip window, the evidence type, the rationale, and the belief before and after. Receipts are events in a **hash-chained log**, so the record is tamper-evident. The dossier is a stack of receipts, with a **time scrubber** that replays the board at any moment of the interview.

### Right of reply
In the last 90 seconds Verity names the most important case still Open and invites the candidate to add anything. Fair to the candidate, and often where the best evidence appears.

### Integrity: observations, not accusations
Tab focus, answer-timing patterns, a possible second voice, and optional local-only gaze, shown as neutral ticks on a timeline. No score. The strongest integrity feature is the questioning itself.

## Mapping to BNB Problem Statement 2
| Required | Verity |
|---|---|
| Profile-aware questioning and evaluation | Cases come from the resume and are weighted by the JD; the dossier shows role coverage (required → claimed → settled) with receipts |
| Conversational, adaptive, spoken | Full-duplex voice with interruptions; question kind adapts to the live belief; strength earns counterfactuals, struggle earns a scaffold |
| Integrity monitoring | Neutral observation timeline, local-first, plus questions a copilot can't pre-answer |

## Users and surfaces
| Surface | Who | Shows |
|---|---|---|
| **Setup** `/` | Recruiter or candidate | Upload resume + JD, cases found, start |
| **Interview** `/interview/[id]` | Candidate | Calm voice screen: presence visual, current question, captions, timer. No board. |
| **Case board** `/board/[id]` | Recruiter / judges | Live cases with belief rings, active case, receipts stream, transcript |
| **Dossier** `/dossier/[id]` | Recruiter; candidate in practice mode | Receipts per case, clips, time scrubber, role coverage, observations, growth notes |

## Out of scope
Accounts, ATS integrations, scheduling, coding exercises, video recording, multi-language, cross-candidate ranking, emotion/tone analysis, cheating scores.

## Success criteria
- A judge understands the board in under 20 seconds.
- In the demo, a ring moves mid-answer and locks at turn end.
- A vague answer produces the right follow-up kind on the **same** case.
- A receipt click plays the right clip.
- The candidate can interrupt, and Verity stops and listens.
