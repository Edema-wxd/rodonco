// src/lib/paystack/verifyTransaction.ts
// Server-side wrapper for Paystack GET /transaction/verify/:reference.
// Used by the /order/[ref] confirmation page to confirm a charge directly with
// Paystack when the async webhook hasn't (yet) marked the order paid — so a
// delayed or dropped webhook can never strand a customer on the pending screen.
//
// Marked `server-only` — PAYSTACK_SECRET_KEY must never reach the browser.

import "server-only";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export interface PaystackVerifyResult {
  /** Transaction status — "success" when the charge completed */
  status: string;
  /** Amount actually charged, in integer kobo */
  amount: number;
  /** The reference echoed back by Paystack */
  reference: string;
  /** Human-readable gateway response (e.g. "Successful", "Declined") */
  gateway_response?: string;
}

interface PaystackVerifyApiResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    amount: number;
    reference: string;
    gateway_response?: string;
  };
}

/**
 * Calls Paystack `GET /transaction/verify/:reference`.
 *
 * Returns the parsed transaction on success, or `null` on any failure
 * (missing key, network error, non-2xx, or malformed body). Never throws —
 * callers treat `null` as "could not verify right now" and fall back to the
 * existing pending/poll behavior.
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResult | null> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("[verifyPaystackTransaction] PAYSTACK_SECRET_KEY is not set — cannot verify.");
    return null;
  }

  try {
    const res = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${secretKey}` },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error(
        `[verifyPaystackTransaction] Paystack returned ${res.status} for ${reference}`
      );
      return null;
    }

    const json = (await res.json()) as PaystackVerifyApiResponse;
    if (!json.status || !json.data) {
      return null;
    }

    return {
      status: json.data.status,
      amount: json.data.amount,
      reference: json.data.reference,
      gateway_response: json.data.gateway_response,
    };
  } catch (err) {
    console.error(`[verifyPaystackTransaction] Request failed for ${reference}:`, err);
    return null;
  }
}
