// src/lib/orders/findPendingReuse.ts
// Pending-order reuse helper (CONTEXT D-05).
//
// Strategy: query the most recent pending order for this customer email, then
// reconstruct a fingerprint from its stored order_items and compare to the
// supplied cart fingerprint. Returns the order if it matches, null otherwise.
//
// Limits:
// - Only the MOST RECENT pending order per email is checked (LIMIT 1, ORDER BY created_at DESC).
// - Fingerprint comparison is exact-string — order-insensitive because both sides use sorted segments.
// - If the DB is unreachable, returns null (safe fallback: create a new order instead).
// - A paid/processing/cancelled order with the same email is never reused.

import "server-only";

import { and, eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { cartFingerprint } from "@/lib/checkout/cartToOrderDraft";
import type { CartItem } from "@/types";

export interface PendingReuseResult {
  id: string;
  reference: string;
  total_ngn: number;
  week_of: string;
}

/**
 * Attempts to find an existing `pending` order for `customerEmail` whose
 * stored `order_items` produce the same cart fingerprint as `cartItems`.
 *
 * Returns the order (id + reference) if a match is found, or `null` if:
 * - No pending orders exist for this email
 * - Cart contents have changed since the order was created
 * - Any DB error occurs (safe fallback: caller creates a new order)
 */
export async function findPendingReuse(
  customerEmail: string,
  cartItems: CartItem[]
): Promise<PendingReuseResult | null> {
  try {
    // Step 1: find the most recent pending order for this email
    const [existingOrder] = await db
      .select({
        id: schema.orders.id,
        reference: schema.orders.reference,
        total_ngn: schema.orders.total_ngn,
        week_of: schema.orders.week_of,
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.customer_email, customerEmail),
          eq(schema.orders.status, "pending")
        )
      )
      .limit(1);

    if (!existingOrder) {
      return null;
    }

    // Step 2: fetch the stored order_items and reconstruct the fingerprint
    const storedItems = await db
      .select({
        product_id: schema.order_items.product_id,
        variant_label: schema.order_items.variant_label,
        prep_option: schema.order_items.prep_option,
        quantity: schema.order_items.quantity,
      })
      .from(schema.order_items)
      .where(eq(schema.order_items.order_id, existingOrder.id));

    // Reconstruct the fingerprint from stored items using the same algorithm
    // as cartFingerprint() from cartToOrderDraft.ts so comparisons are apples-to-apples.
    const storedSegments = storedItems.map((item) =>
      [
        item.product_id,
        item.variant_label ?? "",
        item.prep_option ?? "",
        String(item.quantity),
      ].join(":")
    );
    storedSegments.sort();
    const storedFingerprint = storedSegments.join("|");

    const incomingFingerprint = cartFingerprint(cartItems);

    if (storedFingerprint !== incomingFingerprint) {
      return null;
    }

    return {
      id: existingOrder.id,
      reference: existingOrder.reference,
      total_ngn: existingOrder.total_ngn,
      week_of: existingOrder.week_of,
    };
  } catch (err) {
    // DB unavailable or unexpected error — safe fallback: let caller create a new order.
    console.error("[findPendingReuse] Failed to query pending order:", err);
    return null;
  }
}
