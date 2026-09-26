import { AppShell } from "@/components/app/shell";

export const metadata = { title: "Verity — Practice" };

export default function CandidateLayout({ children }: LayoutProps<"/me">) {
  return <AppShell role="candidate">{children}</AppShell>;
}
