import * as React from "react";

import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPendingOrdersCount } from "@/lib/admin/pendingOrders";

export const dynamic = "force-dynamic";

async function PendingBadge() {
  const count = await getPendingOrdersCount();
  if (count === 0) return null;
  return (
    <>
      {count}
      <span className="sr-only"> pending</span>
    </>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Middleware protects /admin/:path* (not /admin). If we're unauthenticated here,
  // we are on /admin (login) and should render full-bleed without the sidebar.
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <AdminShell
      adminEmail={session.user.email ?? null}
      pendingBadge={
        <React.Suspense fallback={null}>
          <PendingBadge />
        </React.Suspense>
      }
    >
      {children}
    </AdminShell>
  );
}
