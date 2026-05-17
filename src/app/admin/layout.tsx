import * as React from "react";

import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPendingOrdersCount } from "@/lib/admin/pendingOrders";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Middleware protects /admin/:path* (not /admin). If we're unauthenticated here,
  // we are on /admin (login) and should render full-bleed without the sidebar.
  if (!session?.user) {
    return <>{children}</>;
  }

  // Fetch pending count only for authenticated admins (T-8-03-01 mitigation)
  const pendingCount = await getPendingOrdersCount();

  return (
    <AdminShell adminEmail={session.user.email ?? null} pendingCount={pendingCount}>
      {children}
    </AdminShell>
  );
}
