import { Suspense } from "react";
import { getAlerts, getMe } from "@/lib/admin/api";
import { AdminShell, ShellSkeleton } from "@/components/admin/shell";
import { FeedbackProvider } from "@/components/ui/feedback";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Panel>{children}</Panel>
    </Suspense>
  );
}

// Reads the session cookie, so it renders per request; redirects to /admin/login when signed out.
async function Panel({ children }: { children: React.ReactNode }) {
  const [admin, alerts] = await Promise.all([getMe(), getAlerts()]);
  return (
    <FeedbackProvider tone="admin">
      <AdminShell admin={admin} alerts={alerts}>
        {children}
      </AdminShell>
    </FeedbackProvider>
  );
}
