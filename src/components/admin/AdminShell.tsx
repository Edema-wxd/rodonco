"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({
  adminEmail,
  pendingCount,
  children,
}: {
  adminEmail: string | null;
  pendingCount: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-stone-200 bg-white px-4 md:hidden print:hidden">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-800 hover:bg-stone-50"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p
          className="text-lg font-black leading-tight text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          rodo<span className="text-red-600">&</span>co
        </p>
        <span
          className="ml-1 text-[10px] font-black uppercase tracking-widest text-stone-400"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Admin
        </span>
      </header>

      <AdminSidebar
        adminEmail={adminEmail}
        pendingCount={pendingCount}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 print:w-full">{children}</main>
    </div>
  );
}
