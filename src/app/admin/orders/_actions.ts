"use server";

import { auth } from "@/auth";
import { getAdminOrders, type AdminOrder, type OrdersCursor } from "@/lib/admin/orders";
import { ORDERS_PAGE_SIZE } from "./_constants";

export async function loadMoreOrdersAction(cursor: OrdersCursor): Promise<AdminOrder[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return getAdminOrders({ limit: ORDERS_PAGE_SIZE, cursor });
}
