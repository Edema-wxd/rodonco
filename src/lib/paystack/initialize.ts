// src/lib/paystack/initialize.ts
// Server-side wrapper for Paystack POST /transaction/initialize.
// Marked `server-only` — PAYSTACK_SECRET_KEY must never reach the browser.

import "server-only";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export interface PaystackInitializeInput {
  /** Customer email — required by Paystack to link the transaction to a payer */
  email: string;
  /** Transaction amount in integer **kobo** — Paystack always expects kobo, never NGN floats */
  amount: number;
  /** Our server-generated reference (e.g. "RDC-{nanoid}") stored as orders.reference */
  reference: string;
  /** URL Paystack redirects the customer to after payment (redirect flow) */
  callback_url?: string;
  /** Optional metadata forwarded to Paystack; available in webhook data.metadata */
  metadata?: Record<string, unknown>;
}

export interface PaystackInitializeResult {
  /** Opaque token consumed by Paystack Inline JS (`PaystackPop.setup({ key, accessCode })`) */
  access_code: string;
  /** Full redirect URL; not needed for inline popup but returned for flexibility */
  authorization_url: string;
  /** The reference echoed back — should match the input reference */
  reference: string;
}

interface PaystackApiResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Calls Paystack `POST /transaction/initialize` with the supplied parameters.
 * Currency is hard-coded to NGN per project scope (PROJECT.md).
 *
 * @throws Error if the Paystack API returns a non-2xx status or `status: false`.
 */
export async function initializePaystackTransaction(
  input: PaystackInitializeInput
): Promise<PaystackInitializeResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
  }

  const body = {
    email: input.email,
    amount: input.amount, // integer kobo
    currency: "NGN",
    reference: input.reference,
    ...(input.callback_url ? { callback_url: input.callback_url } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Paystack transaction/initialize failed: HTTP ${response.status} — ${errorText}`
    );
  }

  const json: PaystackApiResponse = await response.json();

  if (!json.status) {
    throw new Error(`Paystack transaction/initialize error: ${json.message}`);
  }

  return {
    access_code: json.data.access_code,
    authorization_url: json.data.authorization_url,
    reference: json.data.reference,
  };
}
