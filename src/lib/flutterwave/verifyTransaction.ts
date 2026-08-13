// src/lib/flutterwave/verifyTransaction.ts
// Server-side wrapper for Flutterwave GET /v3/transactions/verify_by_reference.
// Parallel to src/lib/paystack/verifyTransaction.ts — used by the /order/[ref]
// confirmation page to confirm a charge directly with Flutterwave when the async
// webhook hasn't (yet) marked the order paid.
//
// Marked `server-only` — FLW_SECRET_KEY must never reach the browser.

import "server-only";

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com";

export interface FlutterwaveVerifyResult {
  /** Transaction status — "successful" when the charge completed */
  status: string;
  /** Amount actually charged, in **NGN (naira)** */
  amountNgn: number;
  /** Currency of the charge (expected "NGN") */
  currency: string;
  /** Our reference echoed back (tx_ref) */
  reference: string;
}

interface FlutterwaveVerifyApiResponse {
  status: string; // "success" when the lookup itself succeeded
  message: string;
  data?: {
    status: string; // "successful" | "failed" | "pending"
    amount: number; // naira
    currency: string;
    tx_ref: string;
  };
}

/**
 * Calls Flutterwave `GET /v3/transactions/verify_by_reference?tx_ref=…`.
 *
 * Returns the parsed transaction, or `null` on any failure (missing key,
 * network error, non-2xx, unknown reference, or malformed body). Never throws —
 * callers treat `null` as "could not verify right now".
 */
export async function verifyFlutterwaveTransaction(
  reference: string
): Promise<FlutterwaveVerifyResult | null> {
  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) {
    console.error("[verifyFlutterwaveTransaction] FLW_SECRET_KEY is not set — cannot verify.");
    return null;
  }

  try {
    const res = await fetch(
      `${FLUTTERWAVE_BASE_URL}/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${secretKey}` },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      // 404 here just means "no Flutterwave transaction for this ref" — expected
      // for Paystack orders when the page tries both providers. Log at debug level.
      return null;
    }

    const json = (await res.json()) as FlutterwaveVerifyApiResponse;
    if (json.status !== "success" || !json.data) {
      return null;
    }

    return {
      status: json.data.status,
      amountNgn: json.data.amount,
      currency: json.data.currency,
      reference: json.data.tx_ref,
    };
  } catch (err) {
    console.error(`[verifyFlutterwaveTransaction] Request failed for ${reference}:`, err);
    return null;
  }
}
