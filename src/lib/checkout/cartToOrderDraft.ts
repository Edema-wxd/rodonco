// src/lib/checkout/cartToOrderDraft.ts
// Converts CartItem[] into order_items insert shapes and computes a deterministic
// cart fingerprint for the pending-order reuse check (CONTEXT D-05).
//
// Fingerprint format: sorted array of "productId:variantLabel:prepOption:quantity"
// entries joined by "|" and hashed via JSON stable-sort.
// This is order-insensitive (sorted by productId then variant then prep) so that
// re-loading the same cart in a different array order produces the same fingerprint.
// Collision resistance is sufficient for the retry-deduplication use-case — this is
// NOT a cryptographic hash, just a reproducible compact string for DB lookup.

import type { CartItem } from "@/types";

export interface OrderItemDraft {
  order_id: string;
  product_id: string;
  product_name: string;
  variant_label: string | null;
  prep_option: string | null;
  quantity: number;
  unit_price_ngn: number; // integer kobo
  subtotal_ngn: number;   // integer kobo
}

/**
 * Maps a CartItem[] into DB insert shapes for order_items.
 * All price fields remain integer kobo — no float conversion.
 */
export function buildOrderItemsDraftFromCart(
  items: CartItem[],
  orderId: string
): OrderItemDraft[] {
  return items.map((item) => ({
    order_id: orderId,
    product_id: item.productId,
    product_name: item.productName,
    variant_label: item.variantLabel,
    prep_option: item.prepOption,
    quantity: item.quantity,
    unit_price_ngn: item.unitPriceNgn,
    subtotal_ngn: item.subtotalNgn,
  }));
}

/**
 * Produces a deterministic, order-insensitive fingerprint of a cart.
 * Used by POST /api/orders/init to decide whether to reuse an existing
 * pending order (CONTEXT D-05: same customer email + same cart fingerprint).
 *
 * Format: sorted segments joined by "|"
 * Each segment: "{productId}:{variantLabel}:{prepOption}:{quantity}"
 * Null variant/prep is represented as empty string for stable sorting.
 */
export function cartFingerprint(items: CartItem[]): string {
  const segments = items.map((item) =>
    [
      item.productId,
      item.variantLabel ?? "",
      item.prepOption ?? "",
      String(item.quantity),
    ].join(":")
  );
  // Sort so the fingerprint is independent of insertion order
  segments.sort();
  return segments.join("|");
}

/**
 * Computes the total order value in integer kobo from a CartItem[].
 * Sums subtotalNgn (already kobo) — result is always an integer.
 */
export function cartTotalKobo(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.subtotalNgn, 0);
}
