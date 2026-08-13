// src/lib/flutterwave/initialize.ts
// Server-side wrapper for Flutterwave POST /v3/payments (Standard/hosted flow).
// Parallel to src/lib/paystack/initialize.ts — the second payment provider.
// Marked `server-only` — FLW_SECRET_KEY must never reach the browser.

import "server-only";

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com";

export interface FlutterwaveInitializeInput {
  /** Customer email — required by Flutterwave to link the transaction to a payer */
  email: string;
  /** Transaction amount in integer **NGN (naira)** — Flutterwave expects naira, not kobo */
  amountNgn: number;
  /** Our server-generated reference (e.g. "RDC-{nanoid}") — sent as `tx_ref` */
  reference: string;
  /** URL Flutterwave redirects the customer to after payment */
  redirect_url: string;
  /** Customer name — shown on the hosted checkout */
  name?: string;
  /** Customer phone — forwarded to Flutterwave */
  phone?: string;
  /** Optional metadata forwarded to Flutterwave; echoed back in the webhook `data.meta` */
  meta?: Record<string, unknown>;
}

export interface FlutterwaveInitializeResult {
  /** Hosted checkout URL the customer is redirected to (checkout.flutterwave.com/…) */
  link: string;
  /** The reference echoed back (our tx_ref) */
  reference: string;
}

interface FlutterwaveApiResponse {
  status: string; // "success" on a good init
  message: string;
  data?: {
    link: string;
  };
}

/**
 * Calls Flutterwave `POST /v3/payments` with the supplied parameters.
 * Currency is hard-coded to NGN per project scope.
 *
 * @throws Error if FLW_SECRET_KEY is missing, the API returns a non-2xx status,
 *         or `status !== "success"`.
 */
export async function initializeFlutterwaveTransaction(
  input: FlutterwaveInitializeInput
): Promise<FlutterwaveInitializeResult> {
  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) {
    throw new Error("FLW_SECRET_KEY environment variable is not set");
  }

  const body = {
    tx_ref: input.reference,
    amount: input.amountNgn, // integer naira
    currency: "NGN",
    redirect_url: input.redirect_url,
    customer: {
      email: input.email,
      ...(input.name ? { name: input.name } : {}),
      ...(input.phone ? { phonenumber: input.phone } : {}),
    },
    customizations: {
      title: "Rodo & Co",
    },
    ...(input.meta ? { meta: input.meta } : {}),
  };

  const response = await fetch(`${FLUTTERWAVE_BASE_URL}/v3/payments`, {
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
      `Flutterwave /v3/payments failed: HTTP ${response.status} — ${errorText}`
    );
  }

  const json: FlutterwaveApiResponse = await response.json();

  if (json.status !== "success" || !json.data?.link) {
    throw new Error(`Flutterwave /v3/payments error: ${json.message}`);
  }

  return {
    link: json.data.link,
    reference: input.reference,
  };
}
