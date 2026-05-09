import * as React from "react";

import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar adminEmail={session.user.email ?? null} pendingCount={pendingCount} />
      <main className="flex-1 overflow-y-auto print:w-full">{children}</main>
    </div>
  );
}
