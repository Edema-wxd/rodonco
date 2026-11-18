// src/lib/admin/cartRecovery.ts
// Copy for nudging customers with an unpaid (pending) order to finish checking
// out. Shared by the admin WhatsApp button (client) and the recovery email
// (server), so both say the same thing. Pure functions, safe on either side.

import { formatNgn } from "@/lib/admin/format";
import { toWhatsAppNumber } from "@/lib/whatsapp";

const FALLBACK_SITE_URL = "https://www.rodoandco.com";

export type RecoveryItem = {
  product_name: string;
  variant_label: string | null;
  prep_option: string | null;
  quantity: number;
  /** Line total. When every item has one, the message can call out the delivery fee. */
  subtotal_ngn?: number;
};

export type RecoveryOrder = {
  reference: string;
  customer_name: string;
  customer_phone: string;
  total_ngn: number;
  items: RecoveryItem[];
};

/** First word of the customer's name, for a friendlier greeting. */
export function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  return first || "there";
}

/** e.g. "2 × Jollof kit (Large, Chopped)" */
export function describeRecoveryItem(item: RecoveryItem): string {
  const details = [item.variant_label, item.prep_option].filter(Boolean).join(", ");
  return `${item.quantity} × ${item.product_name}${details ? ` (${details})` : ""}`;
}

/**
 * Where the customer finishes their order. Checkout picks up their saved
 * basket if it is still in their browser, and sends them to the shop if not.
 */
export function recoveryCheckoutUrl(baseUrl: string | undefined | null): string {
  const base = (baseUrl ?? "").trim().replace(/\/+$/, "") || FALLBACK_SITE_URL;
  return `${base}/checkout`;
}

export function recoveryEmailSubject(customerName: string): string {
  return `${firstName(customerName)}, your Rodo & Co order is still waiting`;
}

/** e.g. "₦20,000 (including ₦1,500 delivery)" */
export function describeRecoveryTotal(order: RecoveryOrder): string {
  const total = formatNgn(order.total_ngn);
  if (order.items.some((item) => item.subtotal_ngn == null)) return total;
  const itemsTotal = order.items.reduce((sum, item) => sum + (item.subtotal_ngn ?? 0), 0);
  const delivery = order.total_ngn - itemsTotal;
  return delivery > 0 ? `${total} (including ${formatNgn(delivery)} delivery)` : total;
}

export function buildRecoveryWhatsAppText(order: RecoveryOrder, checkoutUrl: string): string {
  const lines = [
    `Hi ${firstName(order.customer_name)}, this is Rodo & Co.`,
    "",
    `We noticed you didn't get to finish checking out. Here's what was in your order (${order.reference}):`,
    "",
    ...order.items.map((item) => `• ${describeRecoveryItem(item)}`),
    "",
    `Order total: ${describeRecoveryTotal(order)}`,
    "",
    `Would you like to complete it? You can check out here: ${checkoutUrl}`,
    "",
    "Or just reply to this message and we'll help you sort it out.",
  ];
  return lines.join("\n");
}

/**
 * wa.me link that opens a chat with the customer, message pre-filled so the
 * admin can review it and press send. Null when the phone number is unusable.
 */
export function buildRecoveryWhatsAppLink(order: RecoveryOrder, checkoutUrl: string): string | null {
  const number = toWhatsAppNumber(order.customer_phone);
  if (!number) return null;
  const text = buildRecoveryWhatsAppText(order, checkoutUrl);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
