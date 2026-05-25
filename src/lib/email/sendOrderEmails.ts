// src/lib/email/sendOrderEmails.ts
// Fire-and-forget email helper: sends customer receipt + admin alert after
// a successful Paystack payment. Both sends are attempted; failures are logged
// but must NOT throw — the webhook handler always returns 200 (CONTEXT D-15).

import "server-only";

import { render } from "react-email";
import React from "react";

import { resend } from "./resendClient";
import { CustomerOrderReceipt } from "./templates/CustomerOrderReceipt";
import { AdminNewOrderAlert } from "./templates/AdminNewOrderAlert";
import { DEFAULT_CONTACT_EMAIL } from "./emailConfig";
import { getSiteSettings } from "@/lib/admin/config";
import type { Order, OrderItem } from "@/types";

// ─── Env ─────────────────────────────────────────────────────────────────────

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "orders@rodoandco.com";
}

function getAdminEmail(): string {
  return process.env.ADMIN_NOTIFICATION_EMAIL ?? "";
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SendOrderEmailsInput {
  order: Order;
  items: OrderItem[];
  /** next_delivery_date from ordering_config — used in customer receipt */
  nextDeliveryDate: string;
}

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Sends customer confirmation + admin alert emails via Resend.
 *
 * Errors are caught and logged; this function NEVER throws.
 * Call with `void sendOrderEmails(...)` from the webhook handler.
 */
export async function sendOrderEmails({
  order,
  items,
  nextDeliveryDate,
}: SendOrderEmailsInput): Promise<void> {
  const from = getFromAddress();
  const adminEmail = getAdminEmail();

  // Fetch contact_email fresh from DB — no cache so admin updates take effect immediately
  let contactEmail = DEFAULT_CONTACT_EMAIL;
  try {
    const settings = await getSiteSettings();
    if (settings?.contact_email) contactEmail = settings.contact_email;
  } catch (err) {
    console.warn("[sendOrderEmails] Could not fetch site_settings contact_email — using default:", err);
  }

  // ── Customer receipt ───────────────────────────────────────────────────────
  try {
    const customerHtml = await render(
      React.createElement(CustomerOrderReceipt, { order, items, nextDeliveryDate, contactEmail })
    );

    const { error: customerError } = await resend.emails.send({
      from: `Rodo & Co <${from}>`,
      to: order.customer_email,
      replyTo: contactEmail,
      subject: `Order confirmed: ${order.reference}`,
      html: customerHtml,
    });

    if (customerError) {
      console.error("[sendOrderEmails] Resend customer receipt error:", customerError);
    }
  } catch (err) {
    console.error("[sendOrderEmails] Unexpected error sending customer receipt:", err);
  }

  // ── Admin alert ───────────────────────────────────────────────────────────
  if (!adminEmail) {
    console.warn("[sendOrderEmails] ADMIN_NOTIFICATION_EMAIL not set — skipping admin alert.");
    return;
  }

  try {
    const adminHtml = await render(
      React.createElement(AdminNewOrderAlert, { order, items })
    );

    const { error: adminError } = await resend.emails.send({
      from: `Rodo & Co <${from}>`,
      to: adminEmail,
      subject: `[Admin] New order: ${order.reference} — ${order.customer_name}`,
      html: adminHtml,
    });

    if (adminError) {
      console.error("[sendOrderEmails] Resend admin alert error:", adminError);
    }
  } catch (err) {
    console.error("[sendOrderEmails] Unexpected error sending admin alert:", err);
  }
}
