import { PageHeader } from "@/components/app/shell";
import { NewSessionForm } from "@/components/app/new-session-form";

export default function NewPracticePage() {
  return (
    <>
      <PageHeader eyebrow="Practice" title="Start a practice interview">
        Practice against your own resume. You get the same receipts a hiring team would see, framed as where to go deeper.
      </PageHeader>
      <div className="px-6 pb-16 md:px-10">
        <NewSessionForm mode="practice" />
      </div>
    </>
  );
}
