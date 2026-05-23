import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { getAdminOrders } from "@/lib/admin/orders";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const initialOrders = await getAdminOrders();

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

      <OrdersTable initialOrders={initialOrders} />
    </div>
  );
}
