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
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
      <div className="mt-6">
        <OrdersTable initialOrders={initialOrders} />
      </div>
    </div>
  );
}

