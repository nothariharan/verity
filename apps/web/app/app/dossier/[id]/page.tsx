import { DossierLoader } from "@/components/dossier/dossier-loader";

export default async function DossierPage({ params }: PageProps<"/app/dossier/[id]">) {
  const { id } = await params;
  return <DossierLoader id={id} />;
}
