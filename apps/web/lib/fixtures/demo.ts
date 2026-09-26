/**
 * Scripted demo event log (not a real interview). Used to build and demo the
 * dashboards before the live engine is wired; every view fed by it shows a
 * "Demo data" badge. Logged in plan/logs/PROGRESS.md as seeded content.
 */
import type {
  Belief,
  Case,
  CaseStatus,
  EventPayload,
  EventType,
  EvidenceType,
  Hypothesis,
  Likelihood,
  QuestionKind,
  VerityEvent,
} from "@verity/contracts";

const b = (owned: number, contributed: number): Belief => ({
  owned,
  contributed,
  surface: Math.round((1 - owned - contributed) * 1000) / 1000,
});

interface CaseSeed {
  id: string;
  label: string;
  claim: string;
  importance: number;
  tech: string[];
  metrics: string[];
  prior: Belief;
  opening: string;
}

const CASES: CaseSeed[] = [
  { id: "case_rag", label: "RAG · 100k docs", claim: "Built a retrieval-augmented QA system over 100k internal documents", importance: 0.92, tech: ["FAISS", "HNSW", "LangChain"], metrics: ["100k docs"], prior: b(0.3, 0.42), opening: "Walk me through how a question flowed through your RAG system." },
  { id: "case_latency", label: "40% latency cut", claim: "Reduced p95 inference latency by 40%", importance: 0.86, tech: ["ONNX", "batching"], metrics: ["40%", "p95"], prior: b(0.28, 0.42), opening: "What was the slowest part of inference before the 40% cut?" },
  { id: "case_kafka", label: "Kafka · 50k ev/s", claim: "Designed a Kafka pipeline processing 50k events/s", importance: 0.8, tech: ["Kafka", "Flink"], metrics: ["50k events/s"], prior: b(0.27, 0.43), opening: "Tell me about the Kafka pipeline and what it fed." },
  { id: "case_k8s", label: "K8s autoscaling", claim: "Implemented Kubernetes autoscaling for model servers", importance: 0.64, tech: ["Kubernetes", "HPA"], metrics: [], prior: b(0.22, 0.43), opening: "How did autoscaling decide when to add a model server?" },
  { id: "case_lora", label: "LoRA fine-tune", claim: "Fine-tuned a 7B model with LoRA for support tickets", importance: 0.7, tech: ["LoRA", "PEFT"], metrics: ["7B"], prior: b(0.25, 0.42), opening: "What did the LoRA fine-tune improve over the base model?" },
  { id: "case_eval", label: "Eval harness", claim: "Built an offline evaluation harness for LLM answers", importance: 0.58, tech: ["pytest"], metrics: [], prior: b(0.25, 0.43), opening: "How did your eval harness decide an answer was wrong?" },
  { id: "case_feature", label: "Feature store", claim: "Migrated features to a shared feature store", importance: 0.46, tech: ["Feast"], metrics: [], prior: b(0.22, 0.45), opening: "Why move to a shared feature store?" },
  { id: "case_mentor", label: "Mentored 3 interns", claim: "Mentored three ML interns", importance: 0.34, tech: [], metrics: ["3"], prior: b(0.3, 0.45), opening: "What did your interns ship?" },
];

interface Exchange {
  caseId: string;
  kind: QuestionKind;
  q: string;
  why: string;
  tied?: [Hypothesis, Hypothesis];
  answer: string;
  quote: string;
  type: EvidenceType;
  lik: Likelihood;
  rationale: string;
  mid?: Belief;
  after: Belief;
  status: CaseStatus;
}

const EXCHANGES: Exchange[] = [
  {
    caseId: "case_rag", kind: "opening", q: "Walk me through how a question flowed through your RAG system.",
    why: "Highest-importance claim; start broad.",
    answer: "A question came in through the support tool, we embedded it, pulled the top twenty chunks from FAISS, re-ranked them with a cross-encoder, and then the model answered with citations back to the source pages.",
    quote: "pulled the top twenty chunks from FAISS, re-ranked them with a cross-encoder",
    type: "mechanism", lik: { owned: 4, contributed: 4, surface: 2 },
    rationale: "Describes the retrieval path concretely, but not who designed it.",
    mid: b(0.36, 0.44), after: b(0.4, 0.46), status: "INVESTIGATING",
  },
  {
    caseId: "case_rag", kind: "ownership", q: "Which part of that pipeline did you decide yourself, and what did you reject?",
    why: "Owned and Contributed are tied; ask who made the decisions.", tied: ["owned", "contributed"],
    answer: "The chunking was mine. I started with fixed five hundred token chunks and recall was bad on long policy docs, so I switched to splitting on headings with a small overlap, and I rejected a bigger embedding model because it doubled index size for maybe two points of recall.",
    quote: "I switched to splitting on headings with a small overlap, and I rejected a bigger embedding model because it doubled index size",
    type: "decision", lik: { owned: 5, contributed: 2, surface: 1 },
    rationale: "Names a decision, the failure that caused it, and a rejected alternative with its cost.",
    mid: b(0.58, 0.33), after: b(0.74, 0.21), status: "SETTLED_OWNED",
  },
  {
    caseId: "case_latency", kind: "opening", q: "What was the slowest part of inference before the forty percent cut?",
    why: "Next most important claim; the metric needs a mechanism.",
    answer: "Honestly the tokenizer and the per-request overhead. We were running one request at a time, so I added dynamic batching with a ten millisecond window and exported the model to ONNX, and p95 went from about five hundred to three hundred milliseconds.",
    quote: "I added dynamic batching with a ten millisecond window and exported the model to ONNX",
    type: "metric", lik: { owned: 5, contributed: 3, surface: 1 },
    rationale: "Ties the metric to two specific changes and a before/after number.",
    mid: b(0.5, 0.36), after: b(0.64, 0.29), status: "INVESTIGATING",
  },
  {
    caseId: "case_latency", kind: "counterfactual", q: "If the batching window had been fifty milliseconds instead, what would have broken?",
    why: "Owned is leading; a counterfactual checks real understanding.",
    answer: "Throughput would go up but the tail would get worse for the interactive users, because a lone request would wait the full window, so p95 would actually regress even though average cost drops.",
    quote: "a lone request would wait the full window, so p95 would actually regress",
    type: "tradeoff", lik: { owned: 5, contributed: 3, surface: 1 },
    rationale: "Reasons correctly about the latency/throughput trade-off unprompted.",
    after: b(0.78, 0.18), status: "SETTLED_OWNED",
  },
  {
    caseId: "case_kafka", kind: "opening", q: "Tell me about the Kafka pipeline and what it fed.",
    why: "High-importance infrastructure claim.",
    answer: "It fed the feature store with click events. The platform team owned the cluster, I wrote the consumers and the schema for our topics, and I handled the backfill when we changed the event format.",
    quote: "The platform team owned the cluster, I wrote the consumers and the schema for our topics",
    type: "ownership", lik: { owned: 2, contributed: 5, surface: 2 },
    rationale: "Clearly separates their part (consumers, schema, backfill) from the platform team's.",
    mid: b(0.27, 0.55), after: b(0.2, 0.66), status: "INVESTIGATING",
  },
  {
    caseId: "case_kafka", kind: "mechanism", q: "How were the topics partitioned, and why that key?",
    why: "Contributed is leading; confirm depth on the part they owned.", tied: ["contributed", "surface"],
    answer: "By user id, so a user's events stayed ordered for the session features. We had a hot partition problem with bot traffic and I think the platform team added a salt for those accounts, but I didn't do that part.",
    quote: "By user id, so a user's events stayed ordered for the session features",
    type: "mechanism", lik: { owned: 2, contributed: 5, surface: 1 },
    rationale: "Explains the key choice and is candid about the part they didn't own.",
    after: b(0.16, 0.76), status: "SETTLED_CONTRIBUTED",
  },
  {
    caseId: "case_k8s", kind: "scaffold", q: "Roughly, what signal told the autoscaler to add another model server?",
    why: "Surface is leading; start with a simpler, scaffolded question.",
    answer: "It was the horizontal pod autoscaler, so CPU I think, or maybe it was custom metrics, I don't remember exactly how it was configured.",
    quote: "CPU I think, or maybe it was custom metrics, I don't remember exactly how it was configured",
    type: "vague", lik: { owned: 1, contributed: 3, surface: 4 },
    rationale: "Can't recall the scaling signal; forgetting alone isn't treated as misrepresentation.",
    mid: b(0.18, 0.4), after: b(0.14, 0.36), status: "INVESTIGATING",
  },
  {
    caseId: "case_k8s", kind: "mechanism", q: "What happened to in-flight requests when a pod was scaled down?",
    why: "Contributed vs Surface tied; ask about a mechanism anyone who ran it would hit.", tied: ["contributed", "surface"],
    answer: "I'm not sure, I mostly used the dashboards the infra team set up.",
    quote: "I mostly used the dashboards the infra team set up",
    type: "non_answer", lik: { owned: 1, contributed: 2, surface: 4 },
    rationale: "Describes using the system, not implementing it.",
    after: b(0.08, 0.2), status: "SETTLED_SURFACE",
  },
  {
    caseId: "case_lora", kind: "opening", q: "What did the LoRA fine-tune improve over the base model?",
    why: "Relevant to the role; not yet explored.",
    answer: "It got better at our ticket categories. We used rank sixteen adapters on the attention layers, and the categorization accuracy on our held-out set went up, though I'd have to check the exact number.",
    quote: "We used rank sixteen adapters on the attention layers",
    type: "mechanism", lik: { owned: 3, contributed: 3, surface: 2 },
    rationale: "Gives a real configuration detail; ownership still unclear.",
    after: b(0.33, 0.45), status: "INVESTIGATING",
  },
];

const OBS = [
  { atIdx: 4, kind: "FOCUS_LOST" as const, detail: "Interview tab hidden" },
  { atIdx: 4, kind: "FOCUS_RETURNED" as const, detail: "Interview tab visible again", offset: 5000 },
];

export const DEMO_SESSION_ID = "ses_demo00000001";
export const DEMO_CANDIDATE = "Priya Raman";
export const DEMO_ROLE = "ML Engineer";

function build(): VerityEvent[] {
  const out: VerityEvent[] = [];
  let seq = 0;
  const push = <T extends EventType>(type: T, payload: EventPayload<T>, atMs: number) => {
    seq += 1;
    out.push({
      seq,
      type,
      payload,
      atMs: Math.round(atMs),
      sessionId: DEMO_SESSION_ID,
      prevHash: seq === 1 ? "0".repeat(64) : `demo${seq - 1}`,
      hash: `demo${seq}`,
    } as VerityEvent);
  };

  push("SESSION_CREATED", { mode: "recruiter", durationSec: 900, role: DEMO_ROLE, candidateName: DEMO_CANDIDATE }, 0);
  push("SKILL_ADDED", { id: "skill_kafka01", name: "Kafka", importance: 0.8, requirement: "required" }, 0);
  push("SKILL_ADDED", { id: "skill_cuda0001", name: "CUDA", importance: 0.7, requirement: "required" }, 0);
  for (const c of CASES) {
    const kase: Case = {
      id: c.id, label: c.label, claim: c.claim, sourceSpan: c.claim, skillIds: c.id === "case_kafka" ? ["skill_kafka01"] : [], technologies: c.tech, metrics: c.metrics,
      importance: c.importance, prior: c.prior, belief: c.prior, provisional: false, status: "UNTOUCHED", conflict: false,
      probes: 0, probeBudget: 3, receiptIds: [], questionIds: [], openingQuestion: c.opening,
    };
    push("CASE_OPENED", kase, 0);
  }
  push("SESSION_STARTED", { textMode: false }, 0);

  let t = 1500;
  const beliefs = new Map(CASES.map((c) => [c.id, c.prior]));
  let active: string | null = null;

  EXCHANGES.forEach((x, i) => {
    const qid = `q_demo${String(i + 1).padStart(2, "0")}`;
    if (x.caseId !== active) {
      push("ACTIVE_CASE_CHANGED", { caseId: x.caseId, why: x.why }, t);
      active = x.caseId;
    }
    push("QUESTION_COMMITTED", { id: qid, caseId: x.caseId, kind: x.kind, text: x.q, why: x.why, tiedPair: x.tied, anchors: [], branch: i === 0 ? "sync" : "A", committedMs: Math.round(t) }, t);
    push("VOICE_STATE", { from: "LISTEN", to: "SPEAK", reason: "question committed" }, t + 250);
    push("VERITY_AUDIO_STARTED", { questionId: qid }, t + 300);
    const qDur = x.q.split(" ").length * 330;
    push("VERITY_AUDIO_ENDED", { questionId: qid }, t + 300 + qDur);
    push("VOICE_STATE", { from: "SPEAK", to: "LISTEN", reason: "playback ended" }, t + 320 + qDur);

    const words = x.answer.split(" ");
    const aStart = t + 300 + qDur + 900;
    const wordMs = 330;
    const segId = `seg_demo${String(i + 1).padStart(2, "0")}`;
    for (let w = 3; w < words.length; w += 3) {
      const at = aStart + w * wordMs;
      push("SEGMENT_PARTIAL", { id: segId, speaker: "candidate", text: words.slice(0, w).join(" "), startMs: Math.round(aStart), endMs: Math.round(at), final: false }, at);
      if (x.mid && w >= Math.floor(words.length * 0.6) && w < Math.floor(words.length * 0.6) + 3) {
        push("BELIEF_UPDATED", { caseId: x.caseId, before: beliefs.get(x.caseId)!, after: x.mid, provisional: true, status: "INVESTIGATING", receiptIds: [], reason: "live: specifics emerging mid-answer" }, at + 10);
      }
    }
    const aEnd = aStart + words.length * wordMs;
    if (i === 4) {
      for (const o of OBS) push("OBSERVATION", { id: `obs_demo${o.kind}`, kind: o.kind, startMs: Math.round(aStart + (o.offset ?? 2000)), detail: o.detail, duringQuestionId: qid }, aStart + (o.offset ?? 2000));
    }
    push("SEGMENT_FINAL", { id: segId, speaker: "candidate", text: x.answer, startMs: Math.round(aStart), endMs: Math.round(aEnd), final: true }, aEnd);
    push("END_OF_TURN", { segmentIds: [segId], text: x.answer, startMs: Math.round(aStart), endMs: Math.round(aEnd) }, aEnd + 700);

    const qi = x.answer.indexOf(x.quote);
    const frac0 = Math.max(0, qi) / x.answer.length;
    const frac1 = (Math.max(0, qi) + x.quote.length) / x.answer.length;
    const before = beliefs.get(x.caseId)!;
    const rid = `rcpt_demo${String(i + 1).padStart(2, "0")}`;
    push("RECEIPT_CREATED", {
      id: rid, caseId: x.caseId, questionId: qid, segmentIds: [segId], quote: x.quote,
      clip: { startMs: Math.round(aStart + (aEnd - aStart) * frac0), endMs: Math.round(aStart + (aEnd - aStart) * frac1) },
      type: x.type, likelihood: x.lik, rationale: x.rationale, before, after: x.after,
    }, aEnd + 1100);
    push("BELIEF_UPDATED", { caseId: x.caseId, before, after: x.after, provisional: false, status: x.status, receiptIds: [rid], reason: x.rationale }, aEnd + 1110);
    beliefs.set(x.caseId, x.after);
    t = aEnd + 1600;
  });

  push("SESSION_ENDED", { reason: "time" }, t + 400);
  return out;
}

export const DEMO_EVENTS: VerityEvent[] = build();
export const DEMO_DURATION_MS = DEMO_EVENTS.at(-1)!.atMs + 2000;

/** Example interview list for the recruiter dashboard (demo only). */
export const DEMO_INTERVIEWS = [
  { id: DEMO_SESSION_ID, candidate: DEMO_CANDIDATE, role: DEMO_ROLE, status: "Completed" as const, when: "Today, 10:40" },
  { id: "demo-live", candidate: "Arjun Mehta", role: "Backend Engineer", status: "Live" as const, when: "Now" },
  { id: "demo-sched", candidate: "Sara Lindqvist", role: "Data Engineer", status: "Scheduled" as const, when: "Tomorrow, 14:00" },
];
