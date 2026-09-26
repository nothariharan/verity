"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/shell";
import { BeliefRing } from "@/components/case/belief-ring";
import { Button } from "@/components/ui/primitives";
import { SERVER_URL } from "@/lib/session";

type Row = {
  id: string;
  role: string;
  createdAt: number;
  started: boolean;
  ended: boolean;
  mode?: string;
  cases: { id: string; label: string; status: string; belief: { owned: number; contributed: number; surface: number } }[];
};

export function PracticeHome() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [down, setDown] = useState(false);

  useEffect(() => {
    fetch(`${SERVER_URL}/v1/sessions`)
      .then((r) => r.json() as Promise<Row[]>)
      .then((all) => setRows(all.filter((r) => r.mode === "practice")))
      .catch(() => setDown(true));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Your interviews"
        right={
          <Button href="/me/new" arrow>
            Start practice
          </Button>
        }
      >
        Upload your resume and answer out loud, or type. Each claim is investigated on its own. There is no overall score.
      </PageHeader>
      <div className="px-6 pb-16 md:px-10">
        {down && <p className="text-[14px] text-muted">The Verity server is not reachable.</p>}
        {rows && rows.length === 0 && (
          <div className="card p-8 text-[14px] text-ink-2">
            No practice runs yet. Start one with your resume.
          </div>
        )}
        <ul className="space-y-3">
          {rows?.map((r) => (
            <li key={r.id}>
              <Link
                href={r.ended ? `/me/report/${r.id}` : `/interview/${r.id}`}
                className="card flex flex-wrap items-center justify-between gap-4 p-4 transition hover:border-ink/30"
              >
                <span>
                  <span className="block text-[15px] font-medium">{r.role}</span>
                  <span className="block text-[12.5px] text-muted">
                    {new Date(r.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {r.ended ? "Report ready" : r.started ? "In progress" : "Ready"}
                  </span>
                </span>
                <span className="flex -space-x-1">
                  {r.cases.slice(0, 6).map((c) => (
                    <span key={c.id} className="rounded-full bg-card p-0.5" title={c.label}>
                      <BeliefRing belief={c.belief} size={28} stroke={4} />
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
