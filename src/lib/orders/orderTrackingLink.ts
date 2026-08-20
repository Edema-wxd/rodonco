// src/lib/orders/orderTrackingLink.ts
// Builds the one-click "track your order" URL embedded in customer emails.
//
// The link points at /api/orders/verify-link carrying a signed session token,
// so following it establishes the same `order_session` cookie the "My Orders"
// magic-link flow sets. The customer lands on their order with full detail
// rather than the PII-stripped view, because /order/[ref] unlocks any order the
// session's verified email actually placed.
//
// The TTL is deliberately longer than the on-demand magic link (30 min): a
// receipt sits in an inbox for days, and the email already displays the same
// name, phone, and address the linked page would — so the link grants the
// recipient no access they didn't already have.

import "server-only";

import { createOrderSessionToken } from "./orderSessionToken";

export const EMAIL_LINK_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface BuildOrderTrackingLinkInput {
  /** App origin, no trailing slash. Empty string when unconfigured. */
  baseUrl: string;
  customerEmail: string;
  /** When set, the link lands on this order rather than the history list. */
  reference?: string;
}

/**
 * Returns the tracking URL, or null when it cannot be built — no configured
 * base URL, or AUTH_SECRET missing. Callers omit the button when null: a
 * missing link must never fail an order email.
 */
export function buildOrderTrackingLink({
  baseUrl,
  customerEmail,
  reference,
}: BuildOrderTrackingLinkInput): string | null {
  if (!baseUrl) return null;

  try {
    const url = new URL("/api/orders/verify-link", baseUrl);
    url.searchParams.set("token", createOrderSessionToken(customerEmail, EMAIL_LINK_TTL_SECONDS));
    if (reference) url.searchParams.set("ref", reference);
    return url.toString();
  } catch (err) {
    console.error("[buildOrderTrackingLink] Could not build tracking link:", err);
    return null;
  }
}
