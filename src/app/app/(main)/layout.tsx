import React from "react";
import { AppShell } from "@/components/layout";
import { MoodleProvider } from "@/components/shared";

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
