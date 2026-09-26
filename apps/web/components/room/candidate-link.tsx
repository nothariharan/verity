"use client";

import { useEffect, useState } from "react";

/** The link the candidate opens to join this interview. The hiring board stays on the watch page. */
export function CandidateLink({ id }: { id: string }) {
  const [href, setHref] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHref(`${window.location.origin}/interview/${id}`);
  }, [id]);

  const copy = async () => {
    if (!href) return;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div id="candidate-link" className="mx-4 mt-4 rounded-2xl border border-ink/20 bg-card px-4 py-3 shadow-[var(--shadow-card)] md:mx-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Candidate link</p>
          <p className="mt-1 text-[13px] text-ink-2">Send this to the candidate. They join the room and answer out loud. You stay on this board.</p>
        </div>
        <div className="flex min-w-[240px] flex-1 items-center gap-2 sm:max-w-md">
          <input
            readOnly
            value={href}
            aria-label="Candidate join link"
            className="h-9 min-w-0 flex-1 rounded-full border border-line bg-bg px-3 font-mono text-[12px] text-ink"
          />
          <button
            type="button"
            onClick={() => void copy()}
            className="h-9 shrink-0 rounded-full border border-line bg-card px-4 text-[13px] font-medium"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
