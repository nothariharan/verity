import { reduceAll } from "@verity/contracts";
import type { EventLog } from "../log/event-log";

export async function listInterviews(log: EventLog) {
  const rows = await log.listSessions();
  return Promise.all(
    rows.map(async (r) => {
      const st = reduceAll(await log.read(r.id));
      return {
        id: r.id,
        createdAt: r.createdAt,
        mode: r.mode,
        role: r.role,
        candidateName: r.candidateName,
        started: st.started,
        ended: !!st.ended,
        cases: st.caseOrder.map((cid) => st.cases[cid]!).map((c) => ({ id: c.id, label: c.label, status: c.status, belief: c.belief })),
      };
    }),
  );
}

export async function readDossier(log: EventLog, id: string) {
  const events = await log.read(id);
  if (!events.length) return null;
  return reduceAll(events);
}
