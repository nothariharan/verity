# Bhooshen's Deep-Dive — How the Mind Works (In Plain English)

> **Audience:** Bhooshen (Bhushan)  
> **Location:** `docs/pitch/bhushan/02_DEEP_DIVE_EXPLANATION.md`  
> **Purpose:** Internalize the exact engineering flow of the Intelligence Mind so you can explain it effortlessly to anyone without memorizing complex formulas.

---

## 1. The Resume Extractor: From PDF to Active Cases

When a recruiter or candidate uploads a resume, the **Extractor** does not just summarize it. It performs a structured extraction into discrete case units:

```
[Candidate Resume PDF] + [Target Job Description]
                        │
                        ▼
               { EXTRACTOR MODEL }
  (Gemini with strict JSON Schema output)
                        │
                        ▼
    ┌────────────────────────────────────────────────────────┐
    │ UP TO 12 SUBSTANTIVE TECHNICAL CASES                   │
    ├────────────────────────────────────────────────────────┤
    │ Case 1: "Built Kafka failover pipeline (100k msg/sec)" │
    │ Case 2: "Migrated Redis cluster to multi-region"       │
    │ Case 3: "Wrote Kubernetes ingress controller in Go"    │
    └────────────────────────────────────────────────────────┘
```

### What the Extractor Looks For:
1. **Source Spans:** It verifies that every extracted claim exists verbatim in the resume text (zero hallucination).
2. **Metrics & Primitives:** Extracts numbers (`100k msg/sec`, `99.99% uptime`, `40ms latency`) and concrete technologies (`Kafka`, `Redis`, `Go`, `Docker`).
3. **Ownership Language:** Checks if the candidate used active builder verbs (*"architected"*, *"designed"*, *"implemented"*) or passive support verbs (*"helped"*, *"participated"*, *"used"*).

---

## 2. The Three Hypotheses: What They Actually Mean

Every case starts with uncertainty across three states:

```
         OWNED                      CONTRIBUTED                   SURFACE
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│ • Architected it        │   │ • Maintained or added   │   │ • Memorized definitions │
│ • Chose the trade-offs  │   │   features to it        │   │ • Watched a tutorial    │
│ • Handled the outages   │   │ • Used someone else's   │   │ • Cannot explain failure│
│ • Knows failure modes   │   │   design spec           │   │   recovery steps        │
└─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
```

### Why This Matters in Real Engineering:
* Most interview bots try to score candidates as "Pass" or "Fail".
* In real engineering teams, you need both:
  * You hire the **Owned** candidate when you need a Staff Architect or Tech Lead to design new greenfield systems.
  * You hire the **Contributed** candidate when you need a productive Mid-Level Feature Engineer who can build reliably within an existing framework.
* Verity gives recruiters this exact distinction.

---

## 3. The Question Policy: Why We Ask Discriminators

Verity does not have a static list of questions. It generates questions to solve **ties**:

### When Tied Between "Owned" and "Contributed":
* *The Goal:* Figure out if they designed the system or just maintained it.
* *The Angle:* Ask about **trade-offs, rejected alternatives, and post-mortems**.
* *Example:* *"When you chose to partition Kafka by user ID rather than region, what failure mode forced that decision?"*
* *The Reaction:* A contributor says, *"That was already configured when I joined."* An owner says, *"We had cross-region replication lag, so we had to pin user sessions locally."*

### When Tied Between "Contributed" and "Surface":
* *The Goal:* Figure out if they actually touched the codebase or just read the docs.
* *The Angle:* Ask about **concrete operational mechanics, CLI commands, and errors**.
* *Example:* *"When that Redis cluster hit split-brain, what exact recovery sequence did you execute?"*

---

## 4. The Speculative Drafter: How We Beat Latency

One of the coolest features you can brag about is **Speculative Dual-Drafting**:
* While the candidate is answering Question 1, the Mind doesn't sit idle.
* In the background, it drafts **two possible follow-up questions at the same time**:
  * **Draft A:** In case the candidate answers well (probe deeper into architectural trade-offs).
  * **Draft B:** In case the candidate gives a vague buzzword answer (probe for concrete mechanics).
* When the candidate stops speaking, the server simply picks Draft A or Draft B in **0 milliseconds**. That’s why Verity has no awkward 2-second pause!

---

## 5. The Consistency Ledger: Catching Contradictions Fairly

If a candidate says in Minute 2: *"Our team had four backend engineers"*, and in Minute 10 says: *"I was the sole engineer on the repo"*, Verity notices.

### The 3-Step Rule (No Unfair Accusations):
1. **Find 2 Quotes:** Locate two exact, timestamped sentences that disagree.
2. **Ask 1 Polite Reconcile Question:** Verity asks gently:  
   *"Earlier you mentioned working with a team of four, and later you noted you were the sole engineer. Could you help me understand how responsibilities were divided?"*
3. **Resolve or Tag:** If the candidate explains (*"I was solo during the MVP, then three contractors joined for the migration"*), the contradiction is completely cleared. Only if they double down on impossible facts is a conflict recorded.

---

## 6. The Golden Invariant: "Forgetting is Not Lying"

If a judge asks: *"What if an applicant is nervous and forgets something?"*
* Tell them: **"Forgetting is not lying."**
* If someone says *"I honestly don't recall that parameter"* or *"I'd have to check our docs"*, Verity assigns a uniform likelihood.
* It does **not** penalize them, it does **not** push them toward Surface, and it never flags a contradiction. Verity simply shifts to an adjacent claim.
