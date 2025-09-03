import AppShell from "@/components/app-shell";
import { MoodleProvider } from "@/components/moodle-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MoodleProvider>
      <AppShell>{children}</AppShell>
    </MoodleProvider>
  );
}
