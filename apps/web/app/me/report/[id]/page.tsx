import { DossierLoader } from "@/components/dossier/dossier-loader";

export default async function ReportPage({ params }: PageProps<"/me/report/[id]">) {
  const { id } = await params;
  return <DossierLoader id={id} practice />;
}
