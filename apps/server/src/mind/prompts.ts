import { z } from "zod";

/** LLM output schemas are kept simple (plain ints, strings) for provider JSON-schema support; code validates further. */
const rating = z.number().int().min(1).max(5);

export const ExtractionOut = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      importance: z.number().min(0).max(1),
      requirement: z.enum(["required", "preferred"]),
    }),
  ),
  cases: z.array(
    z.object({
      claim: z.string(),
      label: z.string(),
      sourceSpan: z.string(),
      technologies: z.array(z.string()),
      metrics: z.array(z.string()),
      skills: z.array(z.string()),
      roleRelevance: z.number().min(0).max(1),
      specificity: z.number().min(0).max(1),
      ownershipLanguage: z.number().min(0).max(1),
      openingQuestion: z.string(),
    }),
  ),
  keyterms: z.array(z.string()),
});
export type ExtractionOut = z.infer<typeof ExtractionOut>;

export const EvidenceItem = z.object({
  quote: z.string(),
  type: z.enum(["decision", "tradeoff", "mechanism", "metric", "failure", "ownership", "vague", "non_answer"]),
  likelihood: z.object({ owned: rating, contributed: rating, surface: rating }),
  rationale: z.string(),
});

export const AssessmentOut = z.object({
  evidence: z.array(EvidenceItem),
  facts: z.array(
    z.object({
      entity: z.string(),
      attribute: z.string(),
      value: z.string(),
      unit: z.string().optional(),
      quote: z.string(),
    }),
  ),
});
export type AssessmentOut = z.infer<typeof AssessmentOut>;

export const DraftOut = z.object({ text: z.string(), anchors: z.array(z.string()) });
export type DraftOut = z.infer<typeof DraftOut>;

export const EXTRACTOR_V1 = {
  name: "extractor.v1",
  system: `You turn a resume and a job description into investigable cases for a technical interview. Output JSON matching the schema.
1. A case is one substantive, checkable claim: a system built, a decision made, a metric achieved, a scope owned. Skip vague lines ("passionate about AI").
2. sourceSpan must be copied character-for-character from the resume (a contiguous substring, usually the bullet text without the leading bullet symbol). Never invent or embellish.
3. Merge duplicates. One idea per case. At most 12 cases.
4. Rate roleRelevance (0-1, against the JD), specificity (0-1: named tech, numbers, decisions -> high), and ownershipLanguage (1 led/designed/built/owned, 0.5 worked on/helped/contributed, 0 unclear).
5. label: at most 28 characters, e.g. "Kafka · 50k ev/s".
6. openingQuestion: one spoken sentence (at most 28 words, exactly one question mark) about a concrete detail of that claim.
7. From the JD, list skills with importance (0-1) and required/preferred; in each case, "skills" lists the names of the JD skills it supports.
8. keyterms: technical terms a speech recognizer should expect.`,
  user: (resume: string, jd: string) => `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jd || "(none provided)"}`,
};

export const ASSESSOR_V1 = {
  name: "assessor.v1",
  system: `You weigh evidence from one interview answer about one resume claim. Three hypotheses:
- OWNED: the candidate built or owned this and can explain decisions, trade-offs, failures, numbers.
- CONTRIBUTED: real involvement in part of it, or used it within someone else's design.
- SURFACE: familiar with the terms, not the work.
For each distinct piece of evidence in the answer (usually 1-3), output: an exact quote copied verbatim from the answer (a contiguous substring); type (decision, tradeoff, mechanism, metric, failure, ownership, vague, non_answer); likelihood 1-5 for each hypothesis ("how expected is this evidence if the hypothesis were true?"); and a one-sentence rationale in plain language.
Rules:
- Specific personal decisions, trade-offs, failure stories, and numbers that make sense are strong evidence for OWNED.
- "We" is normal; judge the specifics, not the pronoun. "The team decided" with no personal role leans CONTRIBUTED. Clearly describing one's own part inside someone else's design is strong CONTRIBUTED evidence.
- Textbook definitions without system-specific detail lean SURFACE.
- "I don't remember", silence, or off-topic -> a single non_answer item with all likelihoods = 3.
- Hesitation, fillers, grammar, accent, and nervousness are NOT evidence. Ignore them.
Also output facts: atomic statements of numbers, sizes, tools, roles, and dates (entity, attribute, value, unit, quote).`,
  user: (p: { claim: string; kind: string; question: string; answer: string; receipts: string[] }) =>
    `CLAIM: ${p.claim}\nQUESTION (${p.kind}): ${p.question}\nANSWER:\n${p.answer}\nEARLIER RECEIPTS ON THIS CLAIM:\n${p.receipts.length ? p.receipts.map((r) => `- ${r}`).join("\n") : "(none)"}`,
};

export const DRAFTER_V1 = {
  name: "drafter.v1",
  system: `You are Verity, a calm, curious, professional technical interviewer. Write exactly ONE spoken question. Output JSON { text, anchors }.
- The target claim and the question kind are decided. Don't change them.
- One sentence, at most 28 words, exactly one question mark at the end. No greeting, praise, preamble, or stacked questions.
- Kinds: opening (a concrete detail of the claim) · ownership (what they personally decided and why) · mechanism (how it actually works in their system) · counterfactual (what would break or change under a new condition) · scaffold (narrower and easier; kind) · reconcile (neutrally ask how the two quoted statements fit together) · reply (invite anything they'd like to add about the open claim).
- Use the candidate's own words when it helps. Never ask for what they already said.
- anchors: 2-5 specifics a genuine answer would likely include.`,
  user: (p: { claim: string; kind: string; tied?: string; belief: string; receipts: string[]; lastAnswer?: string; asked: string[] }) =>
    `CLAIM: ${p.claim}\nKIND: ${p.kind}\nTIED: ${p.tied ?? "-"}\nBELIEF: ${p.belief}\nWHAT WE KNOW: ${p.receipts.length ? p.receipts.join(" | ") : "(nothing yet)"}\nLAST ANSWER: ${p.lastAnswer ?? "-"}\nALREADY ASKED: ${p.asked.length ? p.asked.join(" | ") : "-"}`,
};
