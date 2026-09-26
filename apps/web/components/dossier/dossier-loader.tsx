"use client";

import { useEffect, useState } from "react";
import type { VerityEvent } from "@verity/contracts";
import { DEMO_EVENTS } from "@/lib/fixtures/demo";
import { SERVER_URL } from "@/lib/session";
import { Dossier } from "./dossier";

export function DossierLoader({ id, practice }: { id: string; practice?: boolean }) {
  const demo = id.startsWith("demo") || id === "ses_demo00000001";
  const [events, setEvents] = useState<VerityEvent[] | null>(demo ? DEMO_EVENTS : null);
  const [chain, setChain] = useState<{ ok: boolean; count: number; brokenAtSeq?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demo) return;
    Promise.all([
      fetch(`${SERVER_URL}/v1/sessions/${id}/events`).then((r) => r.json()),
      fetch(`${SERVER_URL}/v1/sessions/${id}/verify`).then((r) => r.json()),
    ])
      .then(([ev, v]) => {
        setEvents(ev);
        setChain(v);
      })
      .catch(() => setError("Could not reach the Verity server."));
  }, [id, demo]);

  if (error) return <p className="p-10 text-[14px] text-muted">{error}</p>;
  if (!events) return <p className="p-10 text-[14px] text-muted">Loading dossier…</p>;
  return <Dossier events={events} demo={demo} practice={practice} chain={chain} sessionId={demo ? undefined : id} />;
}
