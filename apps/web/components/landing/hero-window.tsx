import { cn } from "@/lib/utils";
import { MiniWave } from "./artifacts";
import { HERO_A, HERO_Q, VerityMark } from "./hero-cards";

const ANSWER_WORDS = HERO_A.split(" ");
export const ANSWER_WORD_COUNT = ANSWER_WORDS.length;

type NodeDef = { id: string; title: string; sub?: string; x: number; y: number; state: "live" | "done"; root?: boolean };

const NODES: NodeDef[] = [
  { id: "root", title: "RAG system", sub: "100k documents", x: 50, y: 15, state: "live", root: true },
  { id: "faiss", title: "FAISS", sub: "Vector DB", x: 17, y: 47, state: "done" },
  { id: "retrieval", title: "Retrieval", sub: "Architecture", x: 50, y: 47, state: "done" },
  { id: "latency", title: "Latency", sub: "Optimization", x: 83, y: 47, state: "live" },
  { id: "caching", title: "Caching", sub: "Strategy", x: 33, y: 82, state: "done" },
  { id: "cost", title: "Cost Tradeoffs", x: 67, y: 82, state: "done" },
];

const EDGES: [string, string][] = [
  ["root", "faiss"],
  ["root", "retrieval"],
  ["root", "latency"],
  ["retrieval", "caching"],
  ["retrieval", "cost"],
];

const HALF_H = 7;

const SIDEBAR = [
  { label: "Interview", icon: "M3 8h10M8 3v10" },
  { label: "Claims", icon: "M3 4h10M3 8h10M3 12h6" },
  { label: "Transcript", icon: "M3 4h10v7H7l-3 2v-2H3z" },
  { label: "Evaluation", icon: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 5v3l2 1.5" },
];

export function HeroWindow({ words, speaking }: { words: number; speaking: boolean }) {
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <div
      role="img"
      aria-label="Verity product window: a live investigation of the claim 'RAG system, 100k documents', with a claim tree and a transcript of the question and the candidate's answer."
      className="overflow-hidden rounded-[20px] border border-line bg-card/85 text-left shadow-float backdrop-blur-md"
    >
      <div className="flex h-9 items-center gap-1.5 border-b border-line/70 px-4" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#EC6A5E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F4BF4F]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#61C554]" />
      </div>

      <div className="grid md:grid-cols-[1fr_250px] lg:grid-cols-[148px_1fr_262px]">
        {/* sidebar */}
        <aside className="hidden flex-col border-r border-line/70 p-3 lg:flex" aria-hidden>
          <p className="mb-4 flex items-center gap-1.5 px-2 text-[15px] font-semibold tracking-[-0.03em]">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" />
            Verity
          </p>
          <ul className="space-y-0.5 text-[12.5px]">
            {SIDEBAR.map((s, i) => (
              <li
                key={s.label}
                className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5", i === 0 ? "bg-bg-sunk font-medium text-ink" : "text-muted")}
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                  <path d={s.icon} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {s.label}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-center gap-2 rounded-lg px-1 pt-6">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E9DFD2] text-[10px] font-semibold text-ink-2">AM</span>
            <span className="leading-tight">
              <span className="block text-[11.5px] font-medium text-ink">Aarav Mehta</span>
              <span className="block text-[10.5px] text-muted">ML Engineer</span>
            </span>
          </div>
        </aside>

        {/* claim tree */}
        <div className="flex flex-col border-b border-line/70 p-4 md:border-b-0 md:border-r" aria-hidden>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Live Investigation</p>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-line bg-card px-2.5 text-[10.5px] text-ink-2">
                <span className="anim-blink h-1.5 w-1.5 rounded-full bg-owned" />
                Interview in progress
              </span>
              <span className="inline-flex h-6 items-center gap-1 rounded-full border border-line bg-card px-2.5 font-mono text-[10.5px] text-ink-2">
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                12:34 / 30:00
              </span>
            </div>
          </div>

          <div className="relative mt-3 h-[270px] flex-1 sm:h-[300px]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {EDGES.map(([a, b]) => {
                const p = byId[a]!;
                const c = byId[b]!;
                const y1 = p.y + HALF_H;
                const y2 = c.y - HALF_H;
                const my = (y1 + y2) / 2;
                return (
                  <path
                    key={`${a}-${b}`}
                    d={`M ${p.x} ${y1} C ${p.x} ${my}, ${c.x} ${my}, ${c.x} ${y2}`}
                    fill="none"
                    stroke="var(--line-strong)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
            {NODES.map((n) => (
              <TreeNode key={n.id} {...n} />
            ))}
          </div>
        </div>

        {/* transcript */}
        <div className="flex flex-col p-4">
          <div className="flex gap-4 border-b border-line/70 text-[12px]" aria-hidden>
            <span className="-mb-px border-b-2 border-ink pb-2 font-medium text-ink">Transcript</span>
            <span className="pb-2 text-muted">Evidence</span>
          </div>
          <div className="mt-3 flex-1 space-y-3.5 text-[11.5px] leading-relaxed">
            <Message who="Verity" time="12:31" avatar={<VerityMark className="h-5 w-5" />}>
              {HERO_Q}
            </Message>
            <Message
              who="Candidate"
              time="12:32"
              avatar={<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E9DFD2] text-[8px] font-semibold">AM</span>}
            >
              {ANSWER_WORDS.slice(0, words).join(" ")}
              {speaking && <span aria-hidden className="anim-blink mx-px inline-block h-3 w-[1.5px] translate-y-0.5 bg-ink" />}
              <span aria-hidden className="text-transparent">
                {" "}
                {ANSWER_WORDS.slice(words).join(" ")}
              </span>
            </Message>
          </div>
          <div className="mt-3 flex items-center gap-2.5 border-t border-line/70 pt-3" aria-hidden>
            <MiniWave bars={9} className="text-contributed" animate />
            <span className="text-[11px] text-muted">Listening...</span>
            <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-full border border-line bg-bg-sunk">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-ink" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeNode({ title, sub, x, y, state, root }: NodeDef) {
  const live = state === "live";
  return (
    <div
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 items-start gap-1.5 whitespace-nowrap rounded-lg border border-line bg-card px-2.5 py-1.5 shadow-card",
        root && "px-3 py-2",
      )}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className={cn("mt-[3px] h-2 w-2 shrink-0 rounded-full", live && "anim-blink")}
        style={{ background: live ? "var(--surface)" : "var(--owned)" }}
      />
      <span className="leading-tight">
        <span className={cn("block font-medium text-ink", root ? "text-[12px]" : "text-[11px]")}>{title}</span>
        {sub && <span className={cn("block text-muted", root ? "text-[11px] text-ink-2" : "text-[10px]")}>{sub}</span>}
      </span>
    </div>
  );
}

function Message({ who, time, avatar, children }: { who: string; time: string; avatar: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 shrink-0">{avatar}</span>
      <div className="min-w-0">
        <p className="text-[11px]">
          <span className="font-semibold text-ink">{who}</span> <span className="text-muted">{time}</span>
        </p>
        <p className="mt-0.5 text-ink-2">{children}</p>
      </div>
    </div>
  );
}
