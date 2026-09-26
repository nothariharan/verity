import { PageHeader } from "@/components/app/shell";
import { Button } from "@/components/ui/primitives";
import { InterviewsTable } from "./interviews-table";

export default function InterviewsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Hiring team"
        title="Interviews"
        right={
          <Button href="/app/new" arrow>
            New interview
          </Button>
        }
      >
        Every claim on a resume becomes a case. Watch them resolve live, then open the dossier of receipts. No scores.
      </PageHeader>
      <div className="px-6 pb-16 md:px-10">
        <InterviewsTable />
      </div>
    </>
  );
}
