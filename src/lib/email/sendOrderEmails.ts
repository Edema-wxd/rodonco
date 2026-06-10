// src/lib/email/sendOrderEmails.ts
// Fire-and-forget email helper: sends customer receipt + admin alert after
// a successful Paystack payment. Both sends are attempted; failures are logged
// but must NOT throw — the webhook handler always returns 200 (CONTEXT D-15).

import "server-only";

import { render } from "react-email";
import React from "react";
import { eq, sql } from "drizzle-orm";

import { resend } from "./resendClient";
import { logEmail } from "./logEmail";
import { CustomerOrderReceipt } from "./templates/CustomerOrderReceipt";
import { AdminNewOrderAlert } from "./templates/AdminNewOrderAlert";
import { DEFAULT_CONTACT_EMAIL } from "./emailConfig";
import { getSiteSettings } from "@/lib/admin/config";
import { db, schema } from "@/lib/db";
import { logActivity } from "@/lib/admin/activityLog";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

function logEmailFailure(reference: string, err: unknown): void {
  logActivity({
    adminEmail: "system",
    action: "system.email_send_failed",
    entityLabel: reference,
    details: { error: errorMessage(err) },
  }).catch(() => {});
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
  try {
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

    let allSent = true;

    // ── Customer receipt ───────────────────────────────────────────────────────
    try {
      const customerHtml = await render(
        React.createElement(CustomerOrderReceipt, { order, items, nextDeliveryDate, contactEmail })
      );

      const subject = `Order confirmed: ${order.reference}`;
      const { data: customerData, error: customerError } = await resend.emails.send({
        from: `Rodo & Co <${from}>`,
        to: order.customer_email,
        replyTo: contactEmail,
        subject,
        html: customerHtml,
      });

      logEmail({
        type: "order_receipt",
        to: order.customer_email,
        subject,
        status: customerError ? "failed" : "sent",
        resendId: customerData?.id ?? null,
        error: customerError ? JSON.stringify(customerError) : null,
        orderReference: order.reference,
      });

      if (customerError) {
        allSent = false;
        console.error("[sendOrderEmails] Resend customer receipt error:", customerError);
        logEmailFailure(order.reference, customerError);
      }
    } catch (err) {
      allSent = false;
      console.error("[sendOrderEmails] Unexpected error sending customer receipt:", err);
      logEmailFailure(order.reference, err);
    }

    // ── Admin alert ───────────────────────────────────────────────────────────
    if (!adminEmail) {
      console.warn("[sendOrderEmails] ADMIN_NOTIFICATION_EMAIL not set — skipping admin alert.");
    } else {
      try {
        const adminHtml = await render(
          React.createElement(AdminNewOrderAlert, { order, items })
        );

        const adminSubject = `[Admin] New order: ${order.reference} — ${order.customer_name}`;
        const { data: adminData, error: adminError } = await resend.emails.send({
          from: `Rodo & Co <${from}>`,
          to: adminEmail,
          subject: adminSubject,
          html: adminHtml,
        });

        logEmail({
          type: "admin_alert",
          to: adminEmail,
          subject: adminSubject,
          status: adminError ? "failed" : "sent",
          resendId: adminData?.id ?? null,
          error: adminError ? JSON.stringify(adminError) : null,
          orderReference: order.reference,
        });

        if (adminError) {
          allSent = false;
          console.error("[sendOrderEmails] Resend admin alert error:", adminError);
          logEmailFailure(order.reference, adminError);
        }
      } catch (err) {
        allSent = false;
        console.error("[sendOrderEmails] Unexpected error sending admin alert:", err);
        logEmailFailure(order.reference, err);
      }
    }

    if (allSent) {
      try {
        await db
          .update(schema.orders)
          .set({ notified_at: sql`NOW()` })
          .where(eq(schema.orders.id, order.id));
      } catch (err) {
        console.error("[sendOrderEmails] Failed to write notified_at:", err);
      }
    }
  } catch (err) {
    console.error("[sendOrderEmails] Unexpected error:", err);
    logEmailFailure(order.reference, err);
  }
}
