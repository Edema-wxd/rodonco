import Link from "next/link";

import { cn } from "@/lib/utils";

export type CustomersView = "customers" | "abandoned";

const TABS: { view: CustomersView; label: string; href: string }[] = [
  { view: "customers", label: "Customers", href: "/admin/customers" },
  { view: "abandoned", label: "Abandoned carts", href: "/admin/customers?view=abandoned" },
];

export function CustomersTabs({
  active,
  abandonedCount,
}: {
  active: CustomersView;
  /** Abandoned carts nobody has contacted yet. */
  abandonedCount: number;
}) {
  return (
    <nav
      aria-label="Customer views"
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm outline outline-1 outline-stone-200/60"
    >
      {TABS.map(({ view, label, href }) => {
        const isActive = view === active;
        const count = view === "abandoned" ? abandonedCount : 0;
        return (
          <Link
            key={view}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
              isActive ? "bg-red-600 text-white shadow-sm" : "text-stone-500 hover:bg-stone-50 hover:text-zinc-800",
            )}
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {label}
            {count > 0 ? (
              <span
                title="Not contacted yet"
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  isActive ? "bg-white text-red-600" : "bg-red-600 text-white",
                )}
              >
                {count}
                <span className="sr-only"> not contacted</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
