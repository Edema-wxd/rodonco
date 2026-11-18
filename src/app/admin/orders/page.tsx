import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { getAdminOrders, type OrderFilters } from "@/lib/admin/orders";
import { getPendingOrdersCount } from "@/lib/admin/pendingOrders";
import { ORDERS_PAGE_SIZE } from "./_constants";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; weekOf?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const params = await searchParams;
  const filters: OrderFilters = {
    status: params.status,
    weekOf: params.weekOf,
    search: params.search,
  };

  const [initialOrders, pendingCount] = await Promise.all([
    getAdminOrders({ limit: ORDERS_PAGE_SIZE, filters }),
    getPendingOrdersCount(),
  ]);
  const showingPending = filters.status === "pending";
  // Key forces OrdersTable to remount (reset pagination) when filters change.
  const filterKey = `${filters.status ?? ""}-${filters.weekOf ?? ""}-${filters.search ?? ""}`;

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <p
          className="text-sm font-black uppercase tracking-wider text-red-600"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Admin
        </p>
        <h1
          className="mt-2 text-3xl font-black leading-[1.05] text-zinc-800 sm:text-5xl"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Orders
        </h1>
        {showingPending ? (
          <p
            className="mt-2 text-base text-stone-500"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Checkouts that were started but never paid for. Open a row to delete it.
          </p>
        ) : pendingCount > 0 ? (
          <Link
            href="/admin/orders?status=pending"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-zinc-800 shadow-sm outline outline-1 outline-stone-200/60 transition-colors hover:bg-stone-50"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
              {pendingCount}
            </span>
            pending (unpaid) order{pendingCount === 1 ? "" : "s"}
            <span aria-hidden="true" className="text-stone-400">→</span>
          </Link>
        ) : null}
      </div>

      <OrdersTable key={filterKey} initialOrders={initialOrders} />
    </div>
  );
}
