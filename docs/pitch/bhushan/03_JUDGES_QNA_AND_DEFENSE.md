# Bhooshen's Q&A Defense — The 7 Toughest AI/ML Questions

> **Audience:** Bhooshen (Bhushan)  
> **Location:** `docs/pitch/bhushan/03_JUDGES_QNA_AND_DEFENSE.md`  
> **Purpose:** Pocket cheat sheet for the toughest questions judges might ask you about AI, LLMs, prompt engineering, and evaluation logic.

---

### Q1: "Why did you build this complex case engine instead of just giving ChatGPT a system prompt?"
* **Your Answer:**  
  > *"Because general LLMs suffer from conversational drift. When you prompt ChatGPT to conduct an interview, it defaults to polite, open-ended questions like 'Tell me more about your experience with Docker.' It never drives toward an evidentiary verdict.  
  > Our Case Engine anchors every claim to three competing hypotheses—Owned, Contributed, and Surface—and uses active learning to ask questions that mathematically separate them. It behaves like an investigator with a clear evidentiary goal, not an open-ended chatbot."*

---

### Q2: "How do you stop the LLM from hallucinating technical facts or fake questions?"
* **Your Answer:**  
  > *"We enforce strict Zod contract boundaries.  
  > First, our Resume Extractor must link every extracted claim to an exact verbatim source span in the resume text. If the span isn't in the uploaded document, the case is rejected.  
  > Second, every question is validated through strict structural schema checks before it can be committed to our event log. If an LLM returns invalid JSON or hallucinated parameters, our fallback engine catches it instantly and issues a deterministic fallback question."*

---

### Q3: "What if the candidate is reading answers off an AI copilot like ChatGPT or Final Round AI?"
* **Your Answer:**  
  > *"AI copilots are great at answering generic textbook trivia like 'Explain the difference between TCP and UDP.' But Verity never asks textbook trivia.  
  > Verity asks Socratic counterfactuals about the candidate's own specific system: 'When your Redis cluster hit memory saturation under peak load, what eviction policy did you choose, and why did LRU fail?'  
  > An off-screen copilot cannot answer private architectural trade-offs without seeing the company's internal code, forcing the candidate into awkward 5-second delays that our timing engine detects immediately."*

---

### Q4: "What happens if a resume is poorly formatted or has typos?"
* **Your Answer:**  
  > *"We designed a two-stage ingestion pipeline. First, we use Gemini's large context window with structured schema extraction, which is remarkably resilient to messy PDF columns and imperfect formatting.  
  > Second, if the LLM extraction fails or the network drops, we have an offline heuristic extractor that regexes substantive project lines, extracts numbers and technologies, and generates cases deterministically. The interview never fails to start."*

---

### Q5: "How do you ensure fairness and avoid bias against candidates who get nervous or speak slowly?"
* **Your Answer:**  
  > *"We have two non-negotiable rules built into the code.  
  > First, our belief engine evaluates **text transcripts only**—never vocal pitch, dialect, accent, or cadence. A candidate speaking with an accent has the exact same mathematical likelihood as a native speaker.  
  > Second, **forgetting is not lying**. If an applicant gets nervous and says 'I don't recall that specific command,' our Assessor model assigns a uniform 1:1:1 likelihood ratio. It does not penalize them, it does not move them toward Surface, and it never flags a contradiction."*

---

### Q6: "Why do you use Gemini with an OpenAI fallback?"
* **Your Answer:**  
  > *"In a live voice interview, an API timeout or a 429 rate-limit error kills the conversational flow.  
  > Gemini is our primary model because it has blazing-fast JSON schema generation and low latency. But if Gemini hits an 8-second timeout, rate limit, or 5xx error, our `FallbackLlm` class automatically re-routes the prompt to OpenAI within the exact same turn. The user never notices a hiccup."*

---

### Q7: "What academic research did you base your question policy on?"
* **Your Answer:**  
  > *"We built on the 2026 ICLR Oral paper from **MIT CSAIL and Harvard** titled 'Teaching AI Agents to Ask Better Questions by Playing Battleship' by Gabriel Grand and Joshua Tenenbaum.  
  > They proved that instead of using brute-force LLMs, using an active hypothesis testing model that calculates **Expected Information Gain (EIG)** outperforms frontier models while cutting compute costs by 99%. That’s the exact philosophy behind Verity."*
