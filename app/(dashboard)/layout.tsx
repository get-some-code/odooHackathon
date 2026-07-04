// Server Component — can use getSession() directly
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Fetch the real authenticated user on the server
  const user = await getSession();

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  );
}
