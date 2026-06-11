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
  badge?: React.ReactNode;
};

const buildNavItems = (
  pendingBadge: React.ReactNode,
  abandonedBadge: React.ReactNode,
): NavItem[] => [
  { href: "/admin", label: "Dashboard", Icon: Lucide.LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", Icon: Lucide.Package },
  { href: "/admin/orders", label: "Orders", Icon: Lucide.ShoppingBag },
  { href: "/admin/pending", label: "Pending Orders", Icon: Lucide.Clock, badge: pendingBadge },
  { href: "/admin/prep-list", label: "Prep List", Icon: Lucide.ClipboardList },
  { href: "/admin/manifest", label: "Manifest", Icon: Lucide.Truck },
  { href: "/admin/analytics", label: "Analytics", Icon: Lucide.BarChart2 },
  {
    href: "/admin/abandoned-carts",
    label: "Abandoned Carts",
    Icon: Lucide.ShoppingCart,
    badge: abandonedBadge,
  },
  { href: "/admin/activity", label: "Activity", Icon: Lucide.Activity },
  { href: "/admin/email-logs", label: "Email Logs", Icon: Lucide.Mail },
  { href: "/admin/users", label: "Admin Users", Icon: Lucide.Users },
  { href: "/admin/settings", label: "Settings", Icon: Lucide.Settings2 },
];

export function AdminSidebar({
  adminEmail,
  pendingBadge,
  abandonedBadge,
  mobileOpen,
  onMobileClose,
}: {
  adminEmail: string | null;
  pendingBadge?: React.ReactNode;
  abandonedBadge?: React.ReactNode;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-stone-200 bg-white transition-transform duration-200 print:hidden",
        "md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Brand mark */}
      <div className="flex items-start justify-between px-5 py-6">
        <div>
          <p
            className="text-[10px] font-black uppercase tracking-widest text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
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
        <button
          type="button"
          aria-label="Close menu"
          onClick={onMobileClose}
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-50 md:hidden"
        >
          <Lucide.X className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-4 h-px bg-stone-100" />

      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {buildNavItems(pendingBadge, abandonedBadge).map(({ href, label, Icon, exact, badge }) => {
          const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={onMobileClose}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
                active
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-stone-500 hover:bg-stone-50 hover:text-zinc-800",
              )}
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {badge ? (
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-xs font-bold",
                    active ? "bg-white text-red-600" : "bg-red-600 text-white",
                  )}
                >
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
