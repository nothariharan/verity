import { WaveTile } from "./icon-tiles";
import { Container, SectionHeading } from "./section";
import { VoiceDemo } from "./voice-demo";

const POINTS = [
  { title: "One sentence at a time", body: "Each question is a single spoken sentence aimed at a single claim." },
  { title: "It waits for you", body: "Pauses to think are normal. Verity holds the floor open instead of cutting in." },
  { title: "Only your words count", body: "Beliefs move from what you say, never from your accent, tone, pace, or face." },
];

export function Voice() {
  return (
    <section aria-labelledby="voice-title" className="border-t border-line bg-bg-sunk/50 py-28 sm:py-36">
      <Container className="grid items-center gap-14 md:grid-cols-2 md:gap-16">
        <div>
          <SectionHeading
            id="voice-title"
            eyebrow="Voice"
            title={
              <>
                It feels like a <WaveTile /> conversation. It thinks like an investigation.
              </>
            }
          />
          <ul className="mt-10 space-y-6">
            {POINTS.map((p) => (
              <li key={p.title} className="border-l border-line-strong pl-5">
                <p className="text-[17px] font-semibold tracking-[-0.02em]">{p.title}</p>
                <p className="mt-1 text-[16px] leading-relaxed text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <VoiceDemo />
      </Container>
    </section>
  );
}
