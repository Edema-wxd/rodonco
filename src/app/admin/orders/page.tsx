import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { getAdminOrders, type OrderFilters } from "@/lib/admin/orders";
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

  const initialOrders = await getAdminOrders({ limit: ORDERS_PAGE_SIZE, filters });
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
      </div>

      <OrdersTable key={filterKey} initialOrders={initialOrders} />
    </div>
  );
}
