import { Button } from "@/components/ui/primitives";
import { AskTile } from "./icon-tiles";
import { Container, SectionHeading } from "./section";
import { Reveal } from "./reveal";

const TEAMS = [
  "Questions built from the resume and the role, not a generic bank",
  "A dossier of receipts you can replay, clip by clip",
  "Contributed and Open shown as honest outcomes, not failures",
];

const CANDIDATES = [
  "Practice mode on your own resume before the real thing",
  "Pauses and “I don't remember” never count against you on their own",
  "Judged on what you say, never on accent, tone, or camera",
];

export function Audiences() {
  return (
    <section aria-labelledby="audiences-title" className="border-t border-line bg-bg-sunk/50 py-28 sm:py-36">
      <Container>
        <SectionHeading
          id="audiences-title"
          eyebrow="Who it's for"
          title={
            <>
              Fair to both sides of the <AskTile /> table.
            </>
          }
        />
        <Reveal className="mt-14 grid gap-5 md:grid-cols-2" stagger={0.12}>
          <Panel
            id="teams"
            eyebrow="For hiring teams"
            title="Spend your interview time on the people whose work is real."
            points={TEAMS}
            cta={
              <Button href="/app/new" arrow>
                Start an interview
              </Button>
            }
          />
          <Panel
            id="candidates"
            eyebrow="For candidates"
            title="Show the work behind your resume, in your own words."
            points={CANDIDATES}
            cta={
              <Button href="/me" variant="ghost" arrow>
                Try practice mode
              </Button>
            }
          />
        </Reveal>
      </Container>
    </section>
  );
}

function Panel({
  id,
  eyebrow,
  title,
  points,
  cta,
}: {
  id: string;
  eyebrow: string;
  title: string;
  points: string[];
  cta: React.ReactNode;
}) {
  return (
    <article id={id} aria-labelledby={`${id}-title`} className="card flex scroll-mt-32 md:scroll-mt-24 flex-col p-7 sm:p-10">
      <p className="eyebrow">{eyebrow}</p>
      <h3 id={`${id}-title`} className="headline mt-4 text-balance text-[clamp(26px,3vw,36px)]">
        {title}
      </h3>
      <ul className="mt-8 flex-1 space-y-3.5">
        {points.map((p) => (
          <li key={p} className="flex gap-3 text-[16px] leading-relaxed text-ink-2">
            <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-9">{cta}</div>
    </article>
  );
}
