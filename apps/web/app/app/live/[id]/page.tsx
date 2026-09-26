import { LiveView } from "./live-view";

export default async function LivePage({ params, searchParams }: PageProps<"/app/live/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const invite = query.invite === "1";
  return <LiveView id={id} invite={invite} />;
}
