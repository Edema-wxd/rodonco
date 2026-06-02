"use server";

import { auth } from "@/auth";
import { getAbandonedCarts, type AbandonedCart, type AbandonedCartsCursor } from "@/lib/admin/abandonedCarts";
import { ABANDONED_CARTS_PAGE_SIZE } from "./_constants";

export async function loadMoreAbandonedCartsAction(cursor: AbandonedCartsCursor): Promise<AbandonedCart[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return getAbandonedCarts({ limit: ABANDONED_CARTS_PAGE_SIZE, cursor });
}
