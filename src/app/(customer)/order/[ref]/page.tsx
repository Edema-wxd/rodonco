// src/app/(customer)/order/[ref]/page.tsx
// Order confirmation page — loaded by Paystack success callback redirect.
// Server Component: fetches order data by reference, renders OrderConfirmationView.
// CONF-01: reference textual lookup
// CONF-02: paid gate — non-paid orders render error state
// CONF-03: unknown ref renders error state

import type { Metadata } from "next";
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

  // Parallel-fetch order data, ordering config, and site settings
  const [data, orderingConfig, siteSettings] = await Promise.all([
    getOrderForConfirmation(ref),
    getOrderingConfig(),
    getSiteSettings(),
  ]);

  // Determine which error variant to show when data is null.
  // We can't tell the difference between "not found" and "not paid" from the
  // outside without a second query — but the UI spec provides distinct copy
  // for both. For simplicity at MVP: use "not-found" as the default (covers
  // both cases). A future enhancement could do a second status-only query to
  // pick the appropriate variant.
  const errorVariant = "not-found" as const;

  return (
    <OrderConfirmationView
      data={data}
      errorVariant={errorVariant}
      nextDeliveryDate={orderingConfig.next_delivery_date}
      contactEmail={siteSettings?.contact_email ?? undefined}
    />
  );
}
