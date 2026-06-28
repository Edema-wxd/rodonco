// src/app/(customer)/order/[ref]/page.tsx
// Order confirmation page — loaded by Paystack success callback redirect.
// Server Component: fetches order data by reference, renders OrderConfirmationView.
// CONF-01: reference textual lookup
// CONF-02: paid gate — non-paid orders render error state
// CONF-03: unknown ref renders error state

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getOrderForConfirmation } from "@/lib/orders/getOrderForConfirmation";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { getSiteSettings } from "@/lib/admin/config";
import { OrderConfirmationView } from "@/components/order/OrderConfirmationView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed | Rodo & Co",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;

  const [data, orderingConfig, siteSettings, cookieStore] = await Promise.all([
    getOrderForConfirmation(ref),
    getOrderingConfig(),
    getSiteSettings(),
    cookies(),
  ]);

  const hasViewCookie = cookieStore.has(`order_view_${ref}`);

  const errorVariant =
    data.kind === "pending"
      ? "pending"
      : data.kind === "not-found"
        ? "not-found"
        : data.kind === "error"
          ? "not-found"
          : undefined;

  // Strip PII from the view when the viewer didn't arrive via the post-payment redirect
  const stripped = data.kind === "paid" && !hasViewCookie;

  return (
    <OrderConfirmationView
      data={data.kind === "paid" ? { order: data.order, items: data.items } : null}
      errorVariant={errorVariant}
      stripped={stripped}
      nextDeliveryDate={orderingConfig.next_delivery_date}
      contactEmail={siteSettings?.contact_email ?? undefined}
      reference={ref}
    />
  );
}
