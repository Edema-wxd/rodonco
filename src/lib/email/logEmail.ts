import "server-only";

import { db, schema } from "@/lib/db";

export type EmailType =
  | "order_receipt"
  | "admin_alert"
  | "admin_invite"
  | "delivery_reminder"
  | "order_history_link"
  | "order_status_update";

export interface LogEmailInput {
  type: EmailType;
  to: string;
  subject: string;
  status: "sent" | "failed";
  resendId?: string | null;
  error?: string | null;
  orderReference?: string | null;
}

/** Fire-and-forget — never throws. */
export function logEmail(input: LogEmailInput): void {
  db.insert(schema.email_logs)
    .values({
      type: input.type,
      to: input.to,
      subject: input.subject,
      status: input.status,
      resend_id: input.resendId ?? null,
      error: input.error ?? null,
      order_reference: input.orderReference ?? null,
    })
    .catch((err) => {
      console.error("[logEmail] Failed to write email log:", err);
    });
}
