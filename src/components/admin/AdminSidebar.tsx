"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Lucide from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { AdminSignOut } from "./AdminSignOut";

const NAV_ITEMS = [
  { href: "/admin/orders", label: "Orders", Icon: Lucide.ShoppingBag },
  { href: "/admin/products", label: "Products", Icon: Lucide.Package },
  { href: "/admin/analytics", label: "Analytics", Icon: Lucide.BarChart2 },
  { href: "/admin/settings", label: "Settings", Icon: Lucide.Settings2 },
] as const;

export function AdminSidebar({ adminEmail }: { adminEmail: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-56 shrink-0 flex-col border-r bg-white">
      <div className="px-4 py-5 text-sm font-semibold text-gray-900">Rodo & Co Admin</div>
      <Separator />

      <nav className="flex-1 space-y-1 px-2 py-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition-colors",
                active ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="truncate px-4 py-3 text-sm text-gray-400" title={adminEmail ?? ""}>
        {adminEmail ?? "—"}
      </div>

      <AdminSignOut />
    </aside>
  );
}

