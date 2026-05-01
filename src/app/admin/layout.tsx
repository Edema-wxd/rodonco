import * as React from "react";

import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Middleware protects /admin/:path* (not /admin). If we're unauthenticated here,
  // we are on /admin (login) and should render full-bleed without the sidebar.
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar adminEmail={session.user.email ?? null} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
