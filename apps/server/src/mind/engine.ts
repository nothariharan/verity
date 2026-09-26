import { isValidQuestionText, type Belief, type Case, type Fact, type Likelihood, type Skill } from "@verity/contracts";
import type { LlmProvider } from "../providers/llm/types";
import { newId, type Session, type SessionBrain } from "../session/session";
import { deriveStatus, ETA_PROVISIONAL, guardLikelihood, prior, update } from "./belief";
import { suspectConflict } from "./ledger";
import { CLOSING_TEXT, GREETING, plan, type CaseMemo } from "./policy";
import { pickBranch } from "./speculate";
import { ASSESSOR_V1, AssessmentOut, DRAFTER_V1, DraftOut, EXTRACTOR_V1, ExtractionOut } from "./prompts";

const memos = new Map<string, Map<string, CaseMemo>>();
const flags = new Map<string, { replyAsked: boolean; closingAsked: boolean }>();
const turnBase = new Map<string, Belief>();
const lastPreview = new Map<string, string>();
const drafts = new Map<string, { caseId: string; kind: string; branch: "A" | "B"; text: string }>();

function turnKey(sessionId: string, caseId: string) {
  return `${sessionId}:${caseId}`;
}

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
    async onPartial(s, text) {
      await notePartial(s, text);
    },
    async onEarly(s, text) {
      await noteEarly(s, llm, text);
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
  const stash = drafts.get(s.id);
  drafts.delete(s.id);
  let branch: "A" | "B" | "sync" | "fallback" = "sync";
  let text = d.kind === "opening" ? c.openingQuestion : d.kind === "closing" ? CLOSING_TEXT : "";
  const anchors: string[] = [];
  if (stash && stash.caseId === c.id && stash.kind === d.kind && isValidQuestionText(stash.text)) {
    text = stash.text;
    branch = stash.branch;
  } else if (d.kind !== "opening" && d.kind !== "closing" && llm) {
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
      branch,
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
  let stated: AssessmentOut["facts"] = [];
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
      stated = r.data.facts;
    } catch {
      evidence = [];
    }
  }
  const usable = evidence.filter((e) => e.quote && turn.text.includes(e.quote));
  const items = usable.length ? usable : [heuristicEvidence(turn.text)];

  const origin = turnBase.get(turnKey(s.id, c.id)) ?? c.belief;
  turnBase.delete(turnKey(s.id, c.id));
  lastPreview.delete(turnKey(s.id, c.id));
  let belief = origin;
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
  const known = s.state.facts.filter((f) => f.caseId === c.id);
  const incoming = [
    ...stated
      .filter((f) => f.quote && turn.text.includes(f.quote))
      .map((f) => ({ entity: f.entity, attribute: f.attribute, value: f.value, unit: f.unit, quote: f.quote })),
    ...heuristicFacts(turn.text, c.label),
  ];
  let freshSuspicion = false;
  for (const raw of incoming) {
    const fact: Fact = {
      id: newId("fact"),
      caseId: c.id,
      entity: raw.entity,
      attribute: raw.attribute,
      value: raw.value,
      unit: raw.unit,
      quote: raw.quote,
      atMs: turn.endMs,
    };
    const hit = suspectConflict(known, fact);
    await s.emit({ type: "FACT_RECORDED", payload: fact });
    known.push(fact);
    if (hit && !m.conflictSuspected) {
      freshSuspicion = true;
      m.conflictSuspected = true;
      await s.emit({ type: "CONFLICT_SUSPECTED", payload: { caseId: c.id, factIds: hit.factIds, note: hit.note } });
    }
  }
  if (kind === "reconcile") {
    m.conflictSuspected = false;
    const receiptIds = (s.state.cases[c.id]?.receiptIds ?? ids).slice(-2);
    if (items[0]!.type === "non_answer" || freshSuspicion) {
      if (receiptIds.length >= 2) await s.emit({ type: "CONFLICT_CONFIRMED", payload: { caseId: c.id, receiptIds: [receiptIds[0]!, receiptIds[1]!] } });
    } else {
      await s.emit({ type: "CONFLICT_RESOLVED", payload: { caseId: c.id, receiptIds: ids } });
    }
  }
  const latest = s.state.cases[c.id] ?? c;
  await s.emit({
    type: "BELIEF_UPDATED",
    payload: {
      caseId: c.id,
      before: origin,
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

function activeQuestion(s: Session) {
  const qid = [...s.state.questionOrder].reverse().find((id) => s.state.questions[id]?.caseId !== "case_meta");
  const q = qid ? s.state.questions[qid] : undefined;
  const c = q ? s.state.cases[q.caseId] : undefined;
  return q && c ? { q, c } : null;
}

/** Provisional ring move from the pre-turn belief. No receipt. Buzzwords and "I don't remember" do not move it. */
async function notePartial(s: Session, text: string) {
  const found = activeQuestion(s);
  if (!found || found.q.kind === "closing") return;
  const { c } = found;
  const key = turnKey(s.id, c.id);
  if (!c.provisional || !turnBase.has(key)) turnBase.set(key, c.provisional ? (turnBase.get(key) ?? c.belief) : c.belief);
  const base = turnBase.get(key) ?? c.belief;
  const ev = heuristicEvidence(text);
  if (ev.type === "vague" || ev.type === "non_answer") return;
  if (!/\b(i|we)\b/i.test(text)) return;
  if (lastPreview.get(key) === ev.type) return;
  lastPreview.set(key, ev.type);
  const after = update(base, guardLikelihood(ev.type, ev.likelihood as Likelihood), ETA_PROVISIONAL);
  const m = memoOf(s.id, c.id);
  await s.emit({
    type: "BELIEF_UPDATED",
    payload: {
      caseId: c.id,
      before: base,
      after,
      provisional: true,
      status: deriveStatus(after, { probes: c.probes, probeBudget: c.probeBudget, scaffoldAsked: m.scaffoldAsked, asked: true }),
      receiptIds: [],
      reason: ev.rationale,
    },
  });
}

/** Draft the likely next question while the candidate is still talking. Nothing is spoken here. */
async function noteEarly(s: Session, llm: LlmProvider | null, text: string) {
  const found = activeQuestion(s);
  if (!found) return;
  const { c } = found;
  const base = turnBase.get(turnKey(s.id, c.id)) ?? c.belief;
  const ev = heuristicEvidence(text);
  const moved = ev.type !== "vague" && ev.type !== "non_answer" && /\b(i|we)\b/i.test(text);
  const after = moved ? update(base, guardLikelihood(ev.type, ev.likelihood as Likelihood), ETA_PROVISIONAL) : base;
  const shadow = { ...s.state, cases: { ...s.state.cases, [c.id]: { ...c, belief: after } } };
  const decision = plan(shadow, memos.get(s.id) ?? new Map(), s.now(), flags.get(s.id) ?? { replyAsked: false, closingAsked: false });
  if (!decision || !("caseId" in decision)) return;
  const target = s.state.cases[decision.caseId] ?? c;
  let drafted = fallbackQuestion(target.label, decision.kind);
  if (llm && decision.kind !== "opening" && decision.kind !== "closing") {
    try {
      const r = await llm.generate({
        role: "drafter",
        name: DRAFTER_V1.name,
        system: DRAFTER_V1.system,
        prompt: DRAFTER_V1.user({
          claim: target.claim,
          kind: decision.kind,
          tied: decision.tiedPair?.join(" vs "),
          belief: `owned ${after.owned.toFixed(2)}, contributed ${after.contributed.toFixed(2)}, surface ${after.surface.toFixed(2)}`,
          receipts: target.receiptIds.map((id) => s.state.receipts[id]?.quote).filter(Boolean) as string[],
          asked: target.questionIds.map((id) => s.state.questions[id]?.text).filter(Boolean) as string[],
        }),
        schema: DraftOut,
        temperature: 0.4,
      });
      if (isValidQuestionText(r.data.text)) drafted = r.data.text;
    } catch {
      drafted = fallbackQuestion(target.label, decision.kind);
    }
  }
  drafts.set(s.id, { caseId: decision.caseId, kind: decision.kind, branch: pickBranch(base, after), text: drafted });
}

function heuristicFacts(answer: string, label: string) {
  const m = answer.match(/(\d[\d,]*(?:\.\d+)?)(\s*)(k|ms|s|%|thousand)\b/i);
  if (!m?.[0] || !m[1] || !m[3] || !answer.includes(m[0])) return [];
  return [
    {
      entity: label.slice(0, 48),
      attribute: "stated figure",
      value: m[1].replace(/,/g, ""),
      unit: m[3].toLowerCase(),
      quote: m[0],
    },
  ];
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
