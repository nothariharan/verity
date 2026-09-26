import Link from "next/link";
import { reduceAll } from "@verity/contracts";
import { PageHeader } from "@/components/app/shell";
import { BeliefRing } from "@/components/case/belief-ring";
import { Button, DemoBadge, Pill } from "@/components/ui/primitives";
import { DEMO_EVENTS } from "@/lib/fixtures/demo";
import { HYP_BLURB, STATUS_COLOR, STATUS_LABEL } from "@/lib/hypotheses";
import { finalStatus, orderedCases } from "@/lib/session";
import { formatClock } from "@/lib/utils";

export default function PracticeHome() {
  const s = reduceAll(DEMO_EVENTS);
  const ended = !!s.ended;
  const cases = orderedCases(s).filter((c) => c.status !== "UNTOUCHED");
  const untouched = orderedCases(s).filter((c) => c.status === "UNTOUCHED");
  const deeper = cases.filter((c) => ["OPEN", "SETTLED_SURFACE"].includes(finalStatus(c, ended)));
  const end = DEMO_EVENTS.at(-1)!.atMs;

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            Practice <DemoBadge />
          </>
        }
        title="How your claims hold up"
        right={
          <Button href="/me/new" arrow>
            Start practice
          </Button>
        }
      >
        Each practice run investigates your resume the way a real interview would. Contributed is a respectable outcome; Surface and Open are where to go deeper.
      </PageHeader>

      <div className="grid gap-5 px-6 pb-16 md:px-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow">Latest run · {s.meta?.role}</h2>
              <Link href="/me/report/demo" className="text-[13px] font-medium underline-offset-4 hover:underline">
                Open report →
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {cases.map((c) => {
                const st = finalStatus(c, ended);
                return (
                  <div key={c.id} className="flex flex-col items-center gap-2 text-center">
                    <BeliefRing belief={c.belief} size={72} status={c.status} />
                    <span className="text-[13px] font-medium">{c.label}</span>
                    <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[st] }} />
                      {STATUS_LABEL[st]}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="eyebrow">Where to go deeper</h2>
            <ul className="mt-4 divide-y divide-line">
              {deeper.map((c) => {
                const st = finalStatus(c, ended);
                const lastQ = s.questions[c.questionIds.at(-1)!];
                return (
                  <li key={c.id} className="flex flex-wrap items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <BeliefRing belief={c.belief} size={40} status={c.status} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[14px] font-medium">
                        {c.label} <Pill color={STATUS_COLOR[st]}>{STATUS_LABEL[st]}</Pill>
                      </p>
                      <p className="mt-1 text-[12.5px] text-muted">{HYP_BLURB[st === "OPEN" ? "open" : "surface"]}</p>
                      {lastQ && <p className="mt-2 text-[13px] text-ink-2">Prepare an answer to: “{lastQ.text}”</p>}
                    </div>
                  </li>
                );
              })}
              {untouched.length > 0 && (
                <li className="pt-4 text-[12.5px] text-muted">
                  Not reached yet: {untouched.map((c) => c.label).join(", ")}. A longer run will cover them.
                </li>
              )}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-6">
            <h2 className="eyebrow">Practice runs</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/me/report/demo" className="flex items-center justify-between rounded-xl border border-line p-3 transition hover:border-ink/30">
                  <span>
                    <span className="block text-[13.5px] font-medium">{s.meta?.role}</span>
                    <span className="block text-[12px] text-muted">
                      {formatClock(end)} · {cases.length} claims · {s.receiptOrder.length} receipts
                    </span>
                  </span>
                  <span className="text-muted">→</span>
                </Link>
              </li>
            </ul>
          </section>
          <section className="card p-6 text-[13px] leading-relaxed text-ink-2">
            <h2 className="eyebrow mb-3">How practice works</h2>
            <p>Verity reads your resume, opens a case for each claim, and asks the question that best separates what it can&apos;t yet tell apart.</p>
            <p className="mt-3">
              Saying &ldquo;I don&apos;t remember&rdquo; is fine. Forgetting is not treated as misrepresentation.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
