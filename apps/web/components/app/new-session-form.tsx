"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { SERVER_URL } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Icon } from "./icons";

export function NewSessionForm({ mode }: { mode: "recruiter" | "practice" }) {
  const router = useRouter();
  const [resume, setResume] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [role, setRole] = useState(mode === "practice" ? "ML Engineer" : "");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(900);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("mode", mode);
      fd.set("durationSec", String(duration));
      fd.set("role", role || "Software Engineer");
      if (name) fd.set("candidateName", name);
      if (jd) fd.set("jdText", jd);
      if (resume) fd.set("resume", resume);
      const res = await fetch(`${SERVER_URL}/v1/sessions`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const { sessionId } = (await res.json()) as { sessionId: string };
      router.push(mode === "practice" ? `/interview/${sessionId}` : `/app/live/${sessionId}?invite=1`);
    } catch (err) {
      setError(err instanceof Error ? `${err.message}. Is the server running on ${SERVER_URL}?` : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="card space-y-5 p-6">
        <Field label={mode === "practice" ? "Your resume" : "Candidate resume"} hint="PDF, TXT, or Markdown">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-strong bg-bg/50 px-4 py-5 transition hover:bg-bg",
              resume && "border-solid border-ink/30 bg-card",
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-muted">
              <Icon.upload />
            </span>
            <span className="text-[13.5px]">
              {resume ? <span className="font-medium">{resume.name}</span> : <span className="text-muted">Drop a file or click to upload</span>}
            </span>
            <input type="file" accept=".pdf,.txt,.md" className="sr-only" onChange={(e) => setResume(e.target.files?.[0] ?? null)} />
          </label>
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Role">
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. ML Engineer" className={inputCls} />
          </Field>
          {mode === "recruiter" && (
            <Field label="Candidate name" hint="Optional">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Raman" className={inputCls} />
            </Field>
          )}
        </div>
        <Field label="Job description" hint="Paste it; skills with no matching claim show up as gaps">
          <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={6} className={cn(inputCls, "h-auto py-3")} placeholder="Paste the job description…" />
        </Field>
        <Field label="Length">
          <div className="flex gap-2">
            {[600, 900, 1200].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn("h-9 rounded-full border px-4 text-[13px]", duration === d ? "border-ink bg-ink text-bg" : "border-line bg-card")}
              >
                {d / 60} min
              </button>
            ))}
          </div>
        </Field>
        {error && <p className="rounded-lg bg-conflict/10 px-3 py-2 text-[13px] text-conflict">{error}</p>}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit" disabled={busy} arrow>
            {busy ? "Preparing cases…" : mode === "practice" ? "Start practice" : "Create interview"}
          </Button>
        </div>
      </div>
      <aside className="card h-fit space-y-4 p-6 text-[13px] leading-relaxed text-ink-2">
        <p className="eyebrow">What happens next</p>
        <Step n={1}>Each substantive claim on the resume becomes a case with three hypotheses: Owned, Contributed, Surface.</Step>
        <Step n={2}>
          {mode === "practice"
            ? "You answer out loud. Verity asks the question that best separates what's still unclear."
            : "You get a link to send the candidate. They answer out loud. You watch every case on the live board."}
        </Step>
        <Step n={3}>Every change in belief leaves a receipt: the quote, the clip, and why it moved.</Step>
      </aside>
    </form>
  );
}

const inputCls =
  "h-10 w-full rounded-xl border border-line bg-card px-3.5 text-[14px] outline-none transition placeholder:text-muted/70 focus:border-ink/40 focus:ring-4 focus:ring-ink/5";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium">{label}</span>
        {hint && <span className="text-[11.5px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[10.5px]">{n}</span>
      <p>{children}</p>
    </div>
  );
}
