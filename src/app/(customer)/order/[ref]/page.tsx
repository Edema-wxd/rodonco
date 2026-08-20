// src/app/(customer)/order/[ref]/page.tsx
// Order confirmation page — loaded by Paystack success callback redirect.
// Server Component: fetches order data by reference, renders OrderConfirmationView.
// CONF-01: reference textual lookup
// CONF-02: paid gate — non-paid orders render error state
// CONF-03: unknown ref renders error state
// Full detail requires either an `order_session` whose verified email owns the
// order, or a signed single-order `order_view_grant` from checkout.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getOrderForConfirmation } from "@/lib/orders/getOrderForConfirmation";
import { markOrderPaid } from "@/lib/orders/markOrderPaid";
import { verifyPaystackTransaction } from "@/lib/paystack/verifyTransaction";
import { verifyFlutterwaveTransaction } from "@/lib/flutterwave/verifyTransaction";
import { verifyOrderSessionToken } from "@/lib/orders/orderSessionToken";
import {
  ORDER_VIEW_GRANT_COOKIE,
  grantCoversReference,
} from "@/lib/orders/orderViewGrant";
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

  const [initialData, orderingConfig, siteSettings, cookieStore] = await Promise.all([
    getOrderForConfirmation(ref),
    getOrderingConfig(),
    getSiteSettings(),
    cookies(),
  ]);
  let data = initialData;

  // Self-healing fallback: if the async Paystack webhook hasn't marked this
  // order paid yet (delayed, dropped, or misconfigured), verify the charge
  // directly with Paystack and promote it here so the customer is never
  // stranded on the "Confirming your payment…" screen. Runs on every pending
  // load — including the "Refresh now" button — and is a no-op once paid.
  if (data.kind === "pending") {
    try {
      // Try Paystack first (the default provider, amounts already in kobo).
      const ps = await verifyPaystackTransaction(ref);
      if (ps && ps.status === "success") {
        await markOrderPaid({ reference: ref, amountKobo: ps.amount });
        data = await getOrderForConfirmation(ref);
      } else if (process.env.FLW_SECRET_KEY) {
        // Fall back to Flutterwave when configured. Its verify reports naira, so
        // convert to kobo before the shared markOrderPaid amount check.
        const flw = await verifyFlutterwaveTransaction(ref);
        if (flw && flw.status === "successful") {
          await markOrderPaid({ reference: ref, amountKobo: Math.round(flw.amountNgn * 100) });
          data = await getOrderForConfirmation(ref);
        }
      }
    } catch (err) {
      // Never fail the page render on a verification hiccup — the client-side
      // poll and the "Refresh now" button will retry.
      console.error(`[order page] callback verification failed for ${ref}:`, err);
    }
  }

  const errorVariant =
    data.kind === "pending"
      ? "pending"
      : data.kind === "not-found"
        ? "not-found"
        : data.kind === "error"
          ? "not-found"
          : undefined;

  // Two ways to earn full detail, both settled server-side. Anyone else — a
  // guessed reference, a forwarded link — gets the PII-stripped view.
  //
  //  1. `order_session`: the magic-link cookie carries an email this app itself
  //     verified. It unlocks an order only when the DB row says that email
  //     placed it, so one customer's session can never open another's order.
  //  2. `order_view_grant`: a signed single-order token minted by
  //     /api/orders/init for the browser that started this checkout, so a guest
  //     who just paid sees full detail without an email round-trip.
  //
  // Note both are checked against `ref`/the order row rather than being taken
  // on trust: a cookie is client-controlled, so an unsigned marker naming a
  // reference would be forgeable for any reference.
  const sessionToken = cookieStore.get("order_session")?.value;
  const session = sessionToken ? verifyOrderSessionToken(sessionToken) : null;

  const ownsViaSession =
    data.kind === "paid" &&
    session !== null &&
    session.email.toLowerCase() === data.order.customer_email.toLowerCase();

  const ownsViaGrant = grantCoversReference(
    cookieStore.get(ORDER_VIEW_GRANT_COOKIE)?.value,
    ref
  );

  const stripped = data.kind === "paid" && !ownsViaSession && !ownsViaGrant;

  return (
    <OrderConfirmationView
      data={data.kind === "paid" ? { order: data.order, items: data.items } : null}
      errorVariant={errorVariant}
      stripped={stripped}
      nextDeliveryDate={orderingConfig.next_delivery_date}
      contactEmail={siteSettings?.contact_email ?? undefined}
      whatsappNumber={siteSettings?.whatsapp_number ?? undefined}
      reference={ref}
    />
  );
}
