import { AppShell } from "@/components/app/shell";

export const metadata = { title: "Verity — Hiring team" };

export default function TeamLayout({ children }: LayoutProps<"/app">) {
  return <AppShell role="team">{children}</AppShell>;
}
