import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LiveInvestigation } from "@/components/landing/live-investigation";
import { Voice } from "@/components/landing/voice";
import { Receipts } from "@/components/landing/receipts";
import { Resolution } from "@/components/landing/resolution";
import { Trust } from "@/components/landing/trust";
import { Audiences } from "@/components/landing/audiences";
import { DossierPreview } from "@/components/landing/dossier-preview";
import { FinalCta, LandingFooter } from "@/components/landing/final-cta";

export default function Home() {
  return (
    <>
      <LandingNav />
      <main id="main">
        <Hero />
        <Problem />
        <HowItWorks />
        <LiveInvestigation />
        <Voice />
        <Receipts />
        <Resolution />
        <Trust />
        <Audiences />
        <DossierPreview />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
