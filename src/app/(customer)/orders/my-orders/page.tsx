// src/app/(customer)/orders/my-orders/page.tsx
// Read-only "My Orders" page. Access is via a magic link emailed to the
// customer (see /api/orders/request-link + /api/orders/verify-link) —
// there is no customer login system, so the `order_session` cookie set by
// verify-link is the only proof of identity checked here.

import type { Metadata } from "next";
import { cookies } from "next/headers";

import { verifyOrderSessionToken } from "@/lib/orders/orderSessionToken";
import { getOrdersByEmail } from "@/lib/orders/getOrdersByEmail";
import { OrdersHistoryView } from "@/components/order/OrdersHistoryView";
import { RequestOrderLinkForm } from "@/components/order/RequestOrderLinkForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Orders | Rodo & Co",
};

export default async function MyOrdersPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("order_session")?.value;
  const session = sessionToken ? verifyOrderSessionToken(sessionToken) : null;

  if (!session) {
    return <RequestOrderLinkForm />;
  }

  const orders = await getOrdersByEmail(session.email);

  return <OrdersHistoryView orders={orders} />;
}
