import { LiveView } from "./live-view";

export default async function LivePage({ params }: PageProps<"/app/live/[id]">) {
  const { id } = await params;
  return <LiveView id={id} />;
}
