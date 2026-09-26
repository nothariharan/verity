import { PageHeader } from "@/components/app/shell";
import { NewSessionForm } from "@/components/app/new-session-form";

export default function NewInterviewPage() {
  return (
    <>
      <PageHeader eyebrow="Hiring team" title="New interview">
        Upload the resume and the job description. Verity turns each claim into a case and prepares an opening question for it.
      </PageHeader>
      <div className="px-6 pb-16 md:px-10">
        <NewSessionForm mode="recruiter" />
      </div>
    </>
  );
}
