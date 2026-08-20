// src/lib/email/sendOrderStatusEmails.ts
// Fire-and-forget notifier: tells customers when an admin moves their order to
// a new status. Modelled on sendOrderEmails.ts — every error is caught and
// logged, and this module NEVER throws. An email failure must not fail the
// admin's status update, so callers invoke it as `void sendOrderStatusEmails(...)`.

import "server-only";

import { render } from "react-email";
import React from "react";

import { resend } from "./resendClient";
import { logEmail } from "./logEmail";
import {
  OrderStatusUpdateEmail,
  STATUS_COPY,
  type NotifiableOrderStatus,
} from "./templates/OrderStatusUpdateEmail";
import { buildOrderTrackingLink } from "@/lib/orders/orderTrackingLink";
import { logActivity } from "@/lib/admin/activityLog";
import type { OrderStatus } from "@/types";

/** Resend caps a single batch call at 100 messages. */
const BATCH_LIMIT = 100;

const NOTIFIABLE_STATUSES: readonly NotifiableOrderStatus[] = [
  "processing",
  "delivered",
  "cancelled",
];

export interface StatusEmailRecipient {
  reference: string;
  customer_name: string;
  customer_email: string;
}

// ─── Env ─────────────────────────────────────────────────────────────────────

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "orders@rodoandco.com";
}

/** App base URL with any trailing slashes removed. Empty string when unset. */
function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
}

// ─── Policy ──────────────────────────────────────────────────────────────────

/**
 * Decides whether a transition earns a customer email.
 *
 * - "processing" / "delivered" / "cancelled" — real, customer-visible progress.
 * - "paid" — already covered by the order receipt sent from the payment webhook.
 * - "pending" — a pre-payment internal state the customer never needs told about.
 *
 * A no-op transition (from === to) never notifies: it is a redundant write, not
 * a status change, so re-saving the same status can't re-email the customer.
 */
export function shouldNotifyStatusChange(
  from: OrderStatus | string | null | undefined,
  to: OrderStatus | string,
): to is NotifiableOrderStatus {
  if (from === to) return false;
  return (NOTIFIABLE_STATUSES as readonly string[]).includes(to);
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

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Emails each recipient that their order moved to `status`.
 *
 * Sends through resend.batch.send (chunked at Resend's 100-per-call limit)
 * rather than one call per order, so a full week's bulk transition is a couple
 * of API round trips. Errors are caught and logged; this function NEVER throws.
 */
export async function sendOrderStatusEmails(
  recipients: StatusEmailRecipient[],
  status: NotifiableOrderStatus,
): Promise<void> {
  try {
    if (recipients.length === 0) return;

    const copy = STATUS_COPY[status];
    if (!copy) {
      console.warn(`[sendOrderStatusEmails] No copy for status "${status}" — skipping.`);
      return;
    }

    const from = getFromAddress();
    const baseUrl = getAppBaseUrl();

    for (const group of chunk(recipients, BATCH_LIMIT)) {
      // Render first: a template failure for one order must not lose the rest.
      const prepared: { recipient: StatusEmailRecipient; subject: string; html: string }[] = [];

      for (const recipient of group) {
        try {
          // Null when the link can't be built (no base URL / no AUTH_SECRET) —
          // the email still renders and sends, just without the button.
          const trackUrl = buildOrderTrackingLink({
            baseUrl,
            customerEmail: recipient.customer_email,
            reference: recipient.reference,
          });

          const html = await render(
            React.createElement(OrderStatusUpdateEmail, {
              customerName: recipient.customer_name,
              reference: recipient.reference,
              status,
              trackUrl,
            }),
          );

          prepared.push({ recipient, subject: copy.subject(recipient.reference), html });
        } catch (err) {
          console.error(
            `[sendOrderStatusEmails] Could not render email for ${recipient.reference}:`,
            err,
          );
          logEmailFailure(recipient.reference, err);
        }
      }

      if (prepared.length === 0) continue;

      try {
        const { data, error } = await resend.batch.send(
          prepared.map(({ recipient, subject, html }) => ({
            from: `Rodo & Co <${from}>`,
            to: [recipient.customer_email],
            subject,
            html,
          })),
        );

        prepared.forEach(({ recipient, subject }, i) => {
          logEmail({
            type: "order_status_update",
            to: recipient.customer_email,
            subject,
            status: error ? "failed" : "sent",
            resendId: error ? null : (data?.data?.[i]?.id ?? null),
            error: error ? JSON.stringify(error) : null,
            orderReference: recipient.reference,
          });
        });

        if (error) {
          console.error("[sendOrderStatusEmails] Resend batch error:", error);
          prepared.forEach(({ recipient }) => logEmailFailure(recipient.reference, error));
        }
      } catch (err) {
        console.error("[sendOrderStatusEmails] Unexpected error sending batch:", err);
        prepared.forEach(({ recipient, subject }) => {
          logEmail({
            type: "order_status_update",
            to: recipient.customer_email,
            subject,
            status: "failed",
            error: errorMessage(err),
            orderReference: recipient.reference,
          });
          logEmailFailure(recipient.reference, err);
        });
      }
    }
  } catch (err) {
    console.error("[sendOrderStatusEmails] Unexpected error:", err);
  }
}

/**
 * Notifies a single customer when `from` → `to` warrants it. A no-op for
 * transitions that don't notify, so callers can invoke it unconditionally.
 * NEVER throws.
 */
export async function sendOrderStatusEmail(
  recipient: StatusEmailRecipient,
  from: OrderStatus | string | null | undefined,
  to: OrderStatus | string,
): Promise<void> {
  if (!shouldNotifyStatusChange(from, to)) return;
  await sendOrderStatusEmails([recipient], to);
}
