import * as React from "react";

import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPendingOrdersCount } from "@/lib/admin/pendingOrders";
import { getUncContactedCount } from "@/lib/admin/abandonedCarts";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Middleware protects /admin/:path* (not /admin). If we're unauthenticated here,
  // we are on /admin (login) and should render full-bleed without the sidebar.
  if (!session?.user) {
    return <>{children}</>;
  }

  // Fetch sidebar badge counts in parallel
  const [pendingCount, abandonedCartCount] = await Promise.all([
    getPendingOrdersCount(),
    getUncContactedCount(),
  ]);

  return (
    <AdminShell
      adminEmail={session.user.email ?? null}
      pendingCount={pendingCount}
      abandonedCartCount={abandonedCartCount}
    >
      {children}
    </AdminShell>
  );
}
