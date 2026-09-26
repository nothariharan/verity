"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { reduceAll, type Belief, type CaseStatus } from "@verity/contracts";
import { BeliefRing } from "@/components/case/belief-ring";
import { DemoBadge, Pill } from "@/components/ui/primitives";
import { DEMO_EVENTS, DEMO_INTERVIEWS } from "@/lib/fixtures/demo";
import { STATUS_COLOR } from "@/lib/hypotheses";
import { finalStatus, orderedCases, SERVER_URL } from "@/lib/session";

type Row = {
  id: string;
  candidate: string;
  role: string;
  status: "Live" | "Completed" | "Scheduled" | "Ready";
  when: string;
  cases: { id: string; label: string; status: CaseStatus; belief: Belief }[];
  demo: boolean;
};

type ServerRow = {
  id: string;
  createdAt: number;
  role: string;
  candidateName: string | null;
  started: boolean;
  ended: boolean;
  cases: { id: string; label: string; status: CaseStatus; belief: Belief }[];
};

export function InterviewsTable() {
  const demoRows = useMemo<Row[]>(() => {
    const done = reduceAll(DEMO_EVENTS);
    const live = reduceAll(DEMO_EVENTS, 62_000);
    const toCases = (s: typeof done) => orderedCases(s).map((c) => ({ id: c.id, label: c.label, status: finalStatus(c, !!s.ended), belief: c.belief }));
    return DEMO_INTERVIEWS.map((d) => ({
      ...d,
      demo: true,
      cases: d.status === "Completed" ? toCases(done) : d.status === "Live" ? toCases(live) : [],
    }));
  }, []);
  const [serverRows, setServerRows] = useState<Row[]>([]);
  const [serverUp, setServerUp] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${SERVER_URL}/v1/sessions`)
      .then((r) => r.json() as Promise<ServerRow[]>)
      .then((rows) => {
        setServerUp(true);
        setServerRows(
          rows.map((r) => ({
            id: r.id,
            candidate: r.candidateName ?? "Candidate",
            role: r.role,
            status: r.ended ? "Completed" : r.started ? "Live" : "Ready",
            when: new Date(r.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
            cases: r.cases,
            demo: false,
          })),
        );
      })
      .catch(() => setServerUp(false));
  }, []);

  const rows = [...serverRows, ...demoRows];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line bg-bg/60 text-[11.5px] text-muted">
              <th className="px-5 py-3 font-medium">Candidate</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Claims</th>
              <th className="px-3 py-3 font-medium">Resolved</th>
              <th className="px-3 py-3 font-medium">When</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const tally = (k: CaseStatus) => r.cases.filter((c) => c.status === k).length;
              return (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-bg/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.candidate}</span>
                      {r.demo && <DemoBadge />}
                    </div>
                    <div className="text-[12.5px] text-muted">{r.role}</div>
                  </td>
                  <td className="px-3 py-4">
                    <Pill
                      color={r.status === "Live" ? "var(--owned)" : r.status === "Completed" ? "var(--ink)" : "var(--open)"}
                      pulse={r.status === "Live"}
                    >
                      {r.status}
                    </Pill>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex -space-x-1">
                      {r.cases.slice(0, 8).map((c) => (
                        <span key={c.id} title={c.label} className="rounded-full bg-card p-0.5">
                          <BeliefRing belief={c.belief} size={22} stroke={3.5} status={c.status} />
                        </span>
                      ))}
                      {r.cases.length === 0 && <span className="text-[12.5px] text-muted">—</span>}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    {r.cases.length ? (
                      <div className="flex gap-3 font-mono text-[11.5px]">
                        {(
                          [
                            ["SETTLED_OWNED", "O"],
                            ["SETTLED_CONTRIBUTED", "C"],
                            ["SETTLED_SURFACE", "S"],
                            ["OPEN", "?"],
                          ] as const
                        ).map(([k, l]) => (
                          <span key={k} className="flex items-center gap-1" title={k.replace("SETTLED_", "").toLowerCase()}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[k] }} />
                            {l} {tally(k)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12.5px] text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-[12.5px] text-muted">{r.when}</td>
                  <td className="px-5 py-4 text-right">
                    {r.status === "Live" || r.status === "Ready" ? (
                      <Link href={`/app/live/${r.id}`} className="text-[13px] font-medium underline-offset-4 hover:underline">
                        Watch live →
                      </Link>
                    ) : r.status === "Completed" ? (
                      <Link href={`/app/dossier/${r.demo ? "demo" : r.id}`} className="text-[13px] font-medium underline-offset-4 hover:underline">
                        Open dossier →
                      </Link>
                    ) : (
                      <span className="text-[12.5px] text-muted">Invite sent</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line bg-bg/40 px-5 py-2.5 text-[11.5px] text-muted">
        {serverUp === false
          ? "Server offline: showing demo interviews only."
          : serverUp
            ? `${serverRows.length} interview${serverRows.length === 1 ? "" : "s"} from this server · demo rows below`
            : "Checking server…"}
      </div>
    </div>
  );
}
