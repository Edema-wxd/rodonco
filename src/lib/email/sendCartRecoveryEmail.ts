// src/lib/email/sendCartRecoveryEmail.ts
// Sends the "your order is still waiting" reminder for an unpaid order.
// Unlike the fire-and-forget order emails, the admin is waiting on this one,
// so it returns whether the send worked. It never throws.

import "server-only";

import React from "react";
import { render } from "react-email";

import { recoveryCheckoutUrl, recoveryEmailSubject } from "@/lib/admin/cartRecovery";
import type { RecoveryOrderRecord } from "@/lib/admin/cartRecoveryServer";
import { DEFAULT_CONTACT_EMAIL } from "./emailConfig";
import { logEmail } from "./logEmail";
import { resend } from "./resendClient";
import { CartRecoveryEmail } from "./templates/CartRecoveryEmail";

export type SendCartRecoveryResult = { ok: true } | { ok: false; error: string };

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

export async function sendCartRecoveryEmail(
  order: RecoveryOrderRecord,
  settings: { whatsappNumber?: string | null; contactEmail?: string | null } = {},
): Promise<SendCartRecoveryResult> {
  const subject = recoveryEmailSubject(order.customer_name);
  const from = process.env.RESEND_FROM_EMAIL ?? "orders@rodoandco.com";

  try {
    const html = await render(
      React.createElement(CartRecoveryEmail, {
        customerName: order.customer_name,
        reference: order.reference,
        items: order.items,
        totalNgn: order.total_ngn,
        checkoutUrl: recoveryCheckoutUrl(process.env.NEXT_PUBLIC_APP_URL),
        whatsappNumber: settings.whatsappNumber ?? null,
      }),
    );

    const { data, error } = await resend.emails.send({
      from: `Rodo & Co <${from}>`,
      to: order.customer_email,
      replyTo: settings.contactEmail || DEFAULT_CONTACT_EMAIL,
      subject,
      html,
    });

    logEmail({
      type: "cart_recovery",
      to: order.customer_email,
      subject,
      status: error ? "failed" : "sent",
      resendId: error ? null : (data?.id ?? null),
      error: error ? JSON.stringify(error) : null,
      orderReference: order.reference,
    });

    if (error) {
      console.error("[sendCartRecoveryEmail] Resend error:", error);
      return { ok: false, error: errorMessage(error) };
    }
    return { ok: true };
  } catch (err) {
    console.error("[sendCartRecoveryEmail] Unexpected error:", err);
    logEmail({
      type: "cart_recovery",
      to: order.customer_email,
      subject,
      status: "failed",
      error: errorMessage(err),
      orderReference: order.reference,
    });
    return { ok: false, error: errorMessage(err) };
  }
}
