import { isValidQuestionText, type Case, type Likelihood, type Skill } from "@verity/contracts";
import type { LlmProvider } from "../providers/llm/types";
import { newId, type Session, type SessionBrain } from "../session/session";
import { deriveStatus, guardLikelihood, prior, update } from "./belief";
import { CLOSING_TEXT, GREETING, plan, type CaseMemo } from "./policy";
import { ASSESSOR_V1, AssessmentOut, DRAFTER_V1, DraftOut, EXTRACTOR_V1, ExtractionOut } from "./prompts";

const memos = new Map<string, Map<string, CaseMemo>>();
const flags = new Map<string, { replyAsked: boolean; closingAsked: boolean }>();

function memoOf(sessionId: string, caseId: string): CaseMemo {
  let m = memos.get(sessionId);
  if (!m) memos.set(sessionId, (m = new Map()));
  let c = m.get(caseId);
  if (!c) m.set(caseId, (c = { scaffoldAsked: false, counterfactualAsked: false }));
  return c;
}

/** Offline extractor: one case per substantive resume line. Used when providers are fake, and as a fallback. */
export function heuristicExtract(resume: string, jd: string): ExtractionOut {
  const lines = resume
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter((l) => l.length >= 24);
  const jdSkills = (jd.match(/\b[A-Z][A-Za-z0-9+.#]{2,}\b/g) ?? []).slice(0, 8);
  const cases = lines.slice(0, 12).map((line) => {
    const owns = /\b(led|designed|built|owned|architected)\b/i.test(line) ? 1 : /\b(worked on|helped|contributed)\b/i.test(line) ? 0.5 : 0;
    const nums = (line.match(/\d[\d,]*%?/g) ?? []).slice(0, 3);
    const techs = (line.match(/\b[A-Z][A-Za-z0-9+.#]{1,}\b/g) ?? []).slice(0, 4);
    return {
      claim: line,
      label: line.length > 28 ? `${line.slice(0, 25).trimEnd()}…` : line,
      sourceSpan: line,
      technologies: techs,
      metrics: nums,
      skills: [],
      roleRelevance: 0.6,
      specificity: Math.min(1, (nums.length + techs.length) / 4),
      ownershipLanguage: owns,
      openingQuestion: "What part of that did you decide yourself?",
    };
  });
  return {
    skills: jdSkills.map((name) => ({ name, importance: 0.6, requirement: "preferred" as const })),
    cases,
    keyterms: techsOf(cases),
  };
}

function techsOf(cases: ExtractionOut["cases"]) {
  return Array.from(new Set(cases.flatMap((c) => c.technologies))).slice(0, 20);
}

function fallbackQuestion(label: string, kind: string): string {
  const q =
    kind === "ownership"
      ? `Which part of ${label} did you decide yourself?`
      : kind === "mechanism"
        ? `How does ${label} actually work in your system?`
        : kind === "counterfactual"
          ? `What would break in ${label} if the main assumption changed?`
          : kind === "scaffold"
            ? `What is one concrete piece of ${label} you can describe?`
            : kind === "reconcile"
              ? `How do those two statements about ${label} fit together?`
              : kind === "reply"
                ? `Is there anything else about ${label} you'd like to add?`
                : `Walk me through ${label}.`;
  return isValidQuestionText(q) ? q : "What did you personally decide there?";
}

export function createEngine(llm: LlmProvider | null): { brain: SessionBrain; onCreate: (sessionId: string, s: Session, resume: string, jd: string) => Promise<void> } {
  const brain: SessionBrain = {
    async onStart(s) {
      if (!s.state.caseOrder.length) return;
      flags.set(s.id, { replyAsked: false, closingAsked: false });
      await s.emit({
        type: "QUESTION_COMMITTED",
        payload: {
          id: newId("q"),
          caseId: "case_meta",
          kind: "opening",
          text: GREETING,
          why: "Greeting before the first case.",
          anchors: [],
          branch: "sync",
          committedMs: s.now(),
        },
      });
      await askNext(s, llm);
    },
    async onCandidateTurn(s, turn) {
      const qid = [...s.state.questionOrder].reverse().find((id) => s.state.questions[id]!.caseId !== "case_meta");
      const q = qid ? s.state.questions[qid] : undefined;
      const c = q ? s.state.cases[q.caseId] : undefined;
      if (q && c && q.kind !== "closing") {
        await assess(s, llm, c, q.kind, q.text, turn);
      }
      if (!s.state.ended) await askNext(s, llm);
    },
  };

  return {
    brain,
    async onCreate(_id, s, resume, jd) {
      let extracted: ExtractionOut | null = null;
      if (llm && resume.trim()) {
        try {
          const r = await llm.generate({
            role: "extractor",
            name: EXTRACTOR_V1.name,
            system: EXTRACTOR_V1.system,
            prompt: EXTRACTOR_V1.user(resume, jd),
            schema: ExtractionOut,
            temperature: 0.2,
          });
          extracted = r.data;
        } catch {
          extracted = null;
        }
      }
      const data = extracted ?? heuristicExtract(resume, jd);
      const skills: Skill[] = data.skills.slice(0, 16).map((sk) => ({
        id: newId("skill"),
        name: sk.name.slice(0, 80),
        importance: clamp(sk.importance),
        requirement: sk.requirement,
      }));
      for (const sk of skills) await s.emit({ type: "SKILL_ADDED", payload: sk });

      const ranked = data.cases
        .filter((c) => resume.includes(c.sourceSpan) && isValidQuestionText(c.openingQuestion))
        .map((c) => ({ ...c, importance: clamp(c.roleRelevance) * (0.5 + 0.5 * clamp(c.specificity)) }))
        .sort((a, z) => z.importance - a.importance)
        .slice(0, 12);

      for (const c of ranked.length ? ranked : heuristicExtract(resume, jd).cases.map((c) => ({ ...c, importance: 0.5 }))) {
        if (!resume.includes(c.sourceSpan)) continue;
        const belief = prior(c.specificity, c.ownershipLanguage);
        const kase: Case = {
          id: newId("case"),
          label: c.label.slice(0, 28),
          claim: c.claim,
          sourceSpan: c.sourceSpan,
          skillIds: skills.filter((sk) => c.skills.includes(sk.name)).map((sk) => sk.id),
          technologies: c.technologies.slice(0, 8),
          metrics: c.metrics.slice(0, 6),
          importance: "importance" in c ? c.importance : 0.5,
          prior: belief,
          belief,
          provisional: false,
          status: "UNTOUCHED",
          conflict: false,
          probes: 0,
          probeBudget: 3,
          receiptIds: [],
          questionIds: [],
          openingQuestion: isValidQuestionText(c.openingQuestion) ? c.openingQuestion : fallbackQuestion(c.label, "opening"),
        };
        await s.emit({ type: "CASE_OPENED", payload: kase });
      }
    },
  };
}

async function askNext(s: Session, llm: LlmProvider | null) {
  const f = flags.get(s.id) ?? { replyAsked: false, closingAsked: false };
  const decision = plan(s.state, memos.get(s.id) ?? new Map(), s.now(), f);
  if (!decision) {
    await s.end("done");
    return;
  }
  if ("kind" in decision && decision.kind === "closing" && !("caseId" in decision)) {
    f.closingAsked = true;
    await s.emit({
      type: "QUESTION_COMMITTED",
      payload: {
        id: newId("q"),
        caseId: s.state.activeCaseId ?? "case_meta",
        kind: "closing",
        text: CLOSING_TEXT,
        why: "Time is nearly up.",
        anchors: [],
        branch: "sync",
        committedMs: s.now(),
      },
    });
    await s.end("time");
    return;
  }
  const d = decision as Exclude<typeof decision, { kind: "closing" } | null>;
  if (!("caseId" in d)) return;
  const c = s.state.cases[d.caseId];
  if (!c) return;
  if (s.state.activeCaseId !== c.id) {
    await s.emit({ type: "ACTIVE_CASE_CHANGED", payload: { caseId: c.id, why: d.why } });
  }
  let text = d.kind === "opening" ? c.openingQuestion : d.kind === "closing" ? CLOSING_TEXT : "";
  const anchors: string[] = [];
  if (d.kind !== "opening" && d.kind !== "closing" && llm) {
    try {
      const drafted = await llm.generate({
        role: "drafter",
        name: DRAFTER_V1.name,
        system: DRAFTER_V1.system,
        prompt: DRAFTER_V1.user({
          claim: c.claim,
          kind: d.kind,
          tied: d.tiedPair?.join(" vs "),
          belief: `owned ${c.belief.owned.toFixed(2)}, contributed ${c.belief.contributed.toFixed(2)}, surface ${c.belief.surface.toFixed(2)}`,
          receipts: c.receiptIds.map((id) => s.state.receipts[id]?.quote).filter(Boolean) as string[],
          asked: c.questionIds.map((id) => s.state.questions[id]?.text).filter(Boolean) as string[],
        }),
        schema: DraftOut,
        temperature: 0.4,
      });
      if (isValidQuestionText(drafted.data.text)) {
        text = drafted.data.text;
        anchors.push(...drafted.data.anchors);
      }
    } catch {
      text = "";
    }
  }
  if (!text) text = fallbackQuestion(c.label, d.kind);
  if (d.kind === "reply") f.replyAsked = true;
  if (d.kind === "closing") f.closingAsked = true;
  const m = memoOf(s.id, c.id);
  if (d.kind === "scaffold") m.scaffoldAsked = true;
  if (d.kind === "counterfactual") m.counterfactualAsked = true;
  await s.emit({
    type: "QUESTION_COMMITTED",
    payload: {
      id: newId("q"),
      caseId: c.id,
      kind: d.kind,
      text,
      why: d.why,
      tiedPair: d.tiedPair,
      anchors,
      branch: "sync",
      committedMs: s.now(),
    },
  });
}

async function assess(
  s: Session,
  llm: LlmProvider | null,
  c: Case,
  kind: string,
  question: string,
  turn: { segmentIds: string[]; text: string; startMs: number; endMs: number },
) {
  let evidence: AssessmentOut["evidence"] = [];
  if (llm) {
    try {
      const r = await llm.generate({
        role: "assessor",
        name: ASSESSOR_V1.name,
        system: ASSESSOR_V1.system,
        prompt: ASSESSOR_V1.user({
          claim: c.claim,
          kind,
          question,
          answer: turn.text,
          receipts: c.receiptIds.map((id) => s.state.receipts[id]?.quote).filter(Boolean) as string[],
        }),
        schema: AssessmentOut,
        temperature: 0.1,
      });
      evidence = r.data.evidence;
    } catch {
      evidence = [];
    }
  }
  const usable = evidence.filter((e) => e.quote && turn.text.includes(e.quote));
  const items = usable.length ? usable : [heuristicEvidence(turn.text)];

  let belief = c.belief;
  const ids: string[] = [];
  for (const item of items.slice(0, 3)) {
    const quote = turn.text.includes(item.quote) ? item.quote : turn.text.slice(0, 180);
    const likelihood = guardLikelihood(item.type, item.likelihood as Likelihood);
    const before = belief;
    const after = update(before, likelihood);
    belief = after;
    const id = newId("rcpt");
    ids.push(id);
    const span = Math.max(1, turn.endMs - turn.startMs);
    const at = Math.max(0, turn.text.indexOf(quote));
    await s.emit({
      type: "RECEIPT_CREATED",
      payload: {
        id,
        caseId: c.id,
        questionId: s.state.questionOrder.at(-1) ?? "q_unknown",
        segmentIds: turn.segmentIds,
        quote,
        clip: {
          startMs: turn.startMs + Math.round((at / turn.text.length) * span),
          endMs: turn.startMs + Math.round(((at + quote.length) / turn.text.length) * span),
        },
        type: item.type,
        likelihood,
        rationale: item.rationale,
        before,
        after,
      },
    });
  }
  const m = memoOf(s.id, c.id);
  m.lastEvidence = items[0]!.type;
  const latest = s.state.cases[c.id] ?? c;
  await s.emit({
    type: "BELIEF_UPDATED",
    payload: {
      caseId: c.id,
      before: c.belief,
      after: belief,
      provisional: false,
      status: deriveStatus(belief, {
        probes: latest.probes,
        probeBudget: latest.probeBudget,
        scaffoldAsked: m.scaffoldAsked,
        asked: true,
      }),
      receiptIds: ids,
      reason: items[0]!.rationale,
    },
  });
}

function heuristicEvidence(answer: string): AssessmentOut["evidence"][number] {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const quote = answer.trim().slice(0, 180);
  if (/\b(don'?t remember|do not remember|not sure|i forget|no idea)\b/i.test(answer)) {
    return { quote, type: "non_answer", likelihood: { owned: 3, contributed: 3, surface: 3 }, rationale: "The candidate doesn't remember; that moves nothing." };
  }
  if (words.length >= 16 && /\b(i |i')/i.test(answer) && /\b(because|rejected|chose|decided|switched|designed)\b/i.test(answer)) {
    return { quote, type: "decision", likelihood: { owned: 5, contributed: 2, surface: 1 }, rationale: "Names a personal decision and what it cost." };
  }
  if (words.length >= 12) {
    return { quote, type: "mechanism", likelihood: { owned: 4, contributed: 4, surface: 2 }, rationale: "Describes how it works, without a clear ownership signal." };
  }
  return { quote, type: "vague", likelihood: { owned: 2, contributed: 3, surface: 4 }, rationale: "Too little detail to separate the hypotheses." };
}

function clamp(n: number) {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}
