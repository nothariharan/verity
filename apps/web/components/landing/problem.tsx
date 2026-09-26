import { ResumeTile } from "./icon-tiles";
import { Container } from "./section";
import { Reveal } from "./reveal";

export function Problem() {
  return (
    <section aria-labelledby="problem-title" className="border-t border-line py-28 sm:py-36">
      <Container>
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="eyebrow mb-6">The problem</p>
          <h2 id="problem-title" className="headline text-balance text-[clamp(36px,5vw,64px)]">
            Resumes tell you what candidates <ResumeTile /> claim.{" "}
            <span className="text-muted">Interviews should tell you what they understand.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-pretty text-[17px] leading-relaxed text-muted md:text-[19px]">
            Most interviews check whether someone can recite the vocabulary. Verity asks about the decisions behind each
            line, and keeps the evidence for every conclusion it draws.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
