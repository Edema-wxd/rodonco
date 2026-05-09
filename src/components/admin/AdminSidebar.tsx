"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Lucide from "lucide-react";

import { cn } from "@/lib/utils";

import { AdminSignOut } from "./AdminSignOut";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number;
};

const buildNavItems = (pendingCount: number): NavItem[] => [
  { href: "/admin", label: "Dashboard", Icon: Lucide.LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", Icon: Lucide.ShoppingBag },
  { href: "/admin/products", label: "Products", Icon: Lucide.Package },
  { href: "/admin/analytics", label: "Analytics", Icon: Lucide.BarChart2 },
  { href: "/admin/settings", label: "Settings", Icon: Lucide.Settings2 },
  { href: "/admin/prep-list", label: "Prep List", Icon: Lucide.ClipboardList },
  { href: "/admin/manifest", label: "Manifest", Icon: Lucide.Truck },
  { href: "/admin/pending", label: "Pending Orders", Icon: Lucide.Clock, badge: pendingCount },
];

export function AdminSidebar({
  adminEmail,
  pendingCount,
}: {
  adminEmail: string | null;
  pendingCount: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-60 shrink-0 flex-col border-r border-stone-200 bg-white print:hidden">
      {/* Brand mark */}
      <div className="px-5 py-6">
        <p
          className="text-[10px] font-black uppercase tracking-widest text-stone-400"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Admin
        </p>
        <p
          className="mt-0.5 text-lg font-black leading-tight text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          rodo<span className="text-red-600">&</span>co
        </p>
      </div>

      <div className="mx-4 h-px bg-stone-100" />

      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {buildNavItems(pendingCount).map(({ href, label, Icon, exact, badge }) => {
          const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
                active
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-stone-500 hover:bg-stone-50 hover:text-zinc-800",
              )}
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {badge != null && badge > 0 ? (
                <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 h-px bg-stone-100" />

      <div
        className="truncate px-5 py-3 text-xs font-medium text-stone-400"
        title={adminEmail ?? ""}
        style={{ fontFamily: "var(--font-inter)" }}
      >
        {adminEmail ?? "—"}
      </div>

      <div className="px-3 pb-4">
        <AdminSignOut />
      </div>
    </aside>
  );
}
