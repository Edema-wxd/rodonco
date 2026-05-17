import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PendingOrdersTable } from "@/components/admin/pending/PendingOrdersTable";
import { getPendingOrders } from "@/lib/admin/pendingOrders";

export const dynamic = "force-dynamic";

export default async function AdminPendingPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const orders = await getPendingOrders();

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <p
          className="text-sm font-black uppercase tracking-wider text-red-600"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Admin
        </p>
        <h1
          className="mt-2 text-3xl font-black leading-[1.05] text-zinc-800 sm:text-5xl"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Pending Orders
        </h1>
        <p
          className="mt-2 text-base text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {orders.length === 0
            ? "No abandoned checkouts"
            : `${orders.length} abandoned checkout${orders.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <PendingOrdersTable orders={orders} />
    </div>
  );
}
