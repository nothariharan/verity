import { CandidateInterview } from "./candidate-interview";

export const metadata = { title: "Verity — Interview" };

export default async function InterviewPage({ params }: PageProps<"/interview/[id]">) {
  const { id } = await params;
  return <CandidateInterview id={id} />;
}
