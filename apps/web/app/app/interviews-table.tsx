"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Belief, CaseStatus } from "@verity/contracts";
import { BeliefRing } from "@/components/case/belief-ring";
import { Pill } from "@/components/ui/primitives";
import { STATUS_COLOR } from "@/lib/hypotheses";
import { SERVER_URL } from "@/lib/session";

type Row = {
  id: string;
  candidate: string;
  role: string;
  status: "Live" | "Completed" | "Scheduled" | "Ready";
  when: string;
  cases: { id: string; label: string; status: CaseStatus; belief: Belief }[];
  demo: boolean;
  mode?: string;
};

type ServerRow = {
  id: string;
  createdAt: number;
  role: string;
  candidateName: string | null;
  started: boolean;
  ended: boolean;
  mode?: string;
  cases: { id: string; label: string; status: CaseStatus; belief: Belief }[];
};

export function InterviewsTable() {
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
            mode: r.mode,
            demo: false,
          })),
        );
      })
      .catch(() => setServerUp(false));
  }, []);

  const rows = serverRows.filter((r) => r.mode !== "practice");

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
            {rows.length === 0 && serverUp && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-[14px] text-muted">
                  No interviews yet. Create one and send the candidate the interview link.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const tally = (k: CaseStatus) => r.cases.filter((c) => c.status === k).length;
              return (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-bg/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.candidate}</span>
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
                      <Link href={`/app/dossier/${r.id}`} className="text-[13px] font-medium underline-offset-4 hover:underline">
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
        {serverUp === false ? "The Verity server is not reachable." : serverUp ? `${rows.length} interview${rows.length === 1 ? "" : "s"}` : "Checking server…"}
      </div>
    </div>
  );
}
