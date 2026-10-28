// Facebook pixel helpers. The base code lives in
// src/components/analytics/facebook-pixel.tsx; this module is the typed
// surface the rest of the app tracks events through.

import type { CartItem, OrderItem } from "@/types";

export const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/** Meta reports in the pixel's configured currency; all our prices are naira. */
const CURRENCY = "NGN";

/**
 * Thin wrapper around the pixel's global. Safe to call before the script has
 * loaded (the base code queues calls), when the pixel is disabled, and on the
 * server — all of which no-op.
 */
export function fbq(...args: Parameters<Fbq>) {
  if (typeof window === "undefined") return;
  window.fbq?.(...args);
}

/** Track one of Facebook's standard events, e.g. `AddToCart`, `Purchase`. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  fbq("track", name, params);
}

// ── Content mapping ──────────────────────────────────────────────────────────
// Meta's `contents` array wants `id` and `quantity` per line. Variant and prep
// are part of what was bought, so they're folded into the id — otherwise every
// prep of the same produce reports as one product and the catalogue stats are
// useless for deciding what to advertise.

function contentId(
  productId: string,
  variantLabel: string | null,
  prepOption: string | null
): string {
  return [productId, variantLabel, prepOption].filter(Boolean).join("|");
}

type PixelContent = { id: string; quantity: number; item_price: number };

export function cartContents(items: CartItem[]): PixelContent[] {
  return items.map((i) => ({
    id: contentId(i.productId, i.variantLabel, i.prepOption),
    quantity: i.quantity,
    item_price: i.unitPriceNgn,
  }));
}

export function orderContents(items: OrderItem[]): PixelContent[] {
  return items.map((i) => ({
    id: contentId(i.product_id, i.variant_label, i.prep_option),
    quantity: i.quantity,
    item_price: i.unit_price_ngn,
  }));
}

function cartValue(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.subtotalNgn, 0);
}

// ── Standard events ──────────────────────────────────────────────────────────

/** Product drawer opened. */
export function trackViewContent(args: {
  productId: string;
  productName: string;
  valueNgn: number;
}) {
  trackEvent("ViewContent", {
    content_type: "product",
    content_ids: [args.productId],
    content_name: args.productName,
    value: args.valueNgn,
    currency: CURRENCY,
  });
}

/** A single line added to the cart — not the whole cart. */
export function trackAddToCart(args: {
  item: CartItem;
  productName: string;
}) {
  trackEvent("AddToCart", {
    content_type: "product",
    contents: cartContents([args.item]),
    content_name: args.productName,
    value: args.item.subtotalNgn,
    currency: CURRENCY,
  });
}

/** Checkout reached with a non-empty cart. */
export function trackInitiateCheckout(items: CartItem[]) {
  trackEvent("InitiateCheckout", {
    content_type: "product",
    contents: cartContents(items),
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    value: cartValue(items),
    currency: CURRENCY,
  });
}

/** Delivery details saved, payment step reached. */
export function trackAddPaymentInfo(items: CartItem[]) {
  trackEvent("AddPaymentInfo", {
    content_type: "product",
    contents: cartContents(items),
    value: cartValue(items),
    currency: CURRENCY,
  });
}

/** Waitlist signup. */
export function trackLead(source: string) {
  trackEvent("Lead", { content_name: source });
}

// ── Purchase ─────────────────────────────────────────────────────────────────
// The confirmation page is the only point every payment path passes through
// (Paystack popup, Flutterwave redirect, hosted-page fallback), so Purchase
// fires there. That page is also refreshable and pollable, so the reference is
// recorded once reported and re-reports are dropped — otherwise one order
// would inflate revenue by however many times the customer hit reload.

const PURCHASE_STORAGE_KEY = "rodo-fb-purchases";

function reportedPurchases(): string[] {
  try {
    const raw = window.localStorage.getItem(PURCHASE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    // Private mode / blocked storage: treat as nothing reported. A duplicate
    // Purchase is a better failure than a missing one.
    return [];
  }
}

function rememberPurchase(reference: string) {
  try {
    // Only the recent tail matters for dedupe; keep the key from growing forever.
    const next = [...reportedPurchases(), reference].slice(-50);
    window.localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — nothing to do.
  }
}

/** Reports a paid order once per browser. Returns true if it reported. */
export function trackPurchaseOnce(args: {
  reference: string;
  totalNgn: number;
  items: OrderItem[];
}): boolean {
  if (typeof window === "undefined") return false;
  if (reportedPurchases().includes(args.reference)) return false;

  rememberPurchase(args.reference);
  trackEvent("Purchase", {
    content_type: "product",
    contents: orderContents(args.items),
    num_items: args.items.reduce((sum, i) => sum + i.quantity, 0),
    value: args.totalNgn,
    currency: CURRENCY,
  });
  return true;
}
