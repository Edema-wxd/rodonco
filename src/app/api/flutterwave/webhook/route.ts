// src/app/api/flutterwave/webhook/route.ts
// POST /api/flutterwave/webhook
//
// Flutterwave counterpart to /api/paystack/webhook. Handles webhook deliveries:
//  1. Rate-limit per IP
//  2. Authenticate via the static `verif-hash` header (FLW_WEBHOOK_HASH)
//  3. Parse JSON
//  4. Handle charge.completed (status "successful"): idempotent pending → paid
//  5. Log charge failures for ops visibility
//  6. Always return 200 on handled events — non-200 triggers Flutterwave retries
//
// The pending → paid transition reuses markOrderPaid, so the amount check, atomic
// transition, and receipt emails stay identical to the Paystack path. Flutterwave
// reports amounts in NGN (naira), so we convert to kobo before calling the helper.

import "server-only";

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { verifyFlutterwaveSignature } from "@/lib/flutterwave/verifySignature";
import { db, schema } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders/markOrderPaid";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { logActivity } from "@/lib/admin/activityLog";

// ─── Flutterwave payload types ────────────────────────────────────────────────
// Minimal shapes covering the fields we actually use.

interface FlutterwaveChargeData {
  tx_ref: string;
  status: string; // "successful" | "failed"
  amount: number; // naira
  currency?: string;
  processor_response?: string;
}

interface FlutterwaveWebhookPayload {
  event: string; // "charge.completed"
  data: FlutterwaveChargeData;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  // ── Rate limit: 60/min per IP ──
  const ip = getClientIP(req);
  const rl = await rateLimit(ip, { requests: 60, window: "1 m", prefix: "rl:flw-webhook", route: "/api/flutterwave/webhook" });
  if (rl.limited) return rl.response;

  // ── Step 1: Authenticate via the static verif-hash header ──
  const signature = req.headers.get("verif-hash") ?? "";
  const secret = process.env.FLW_WEBHOOK_HASH ?? "";

  if (!secret) {
    console.error("[flw-webhook] FLW_WEBHOOK_HASH is not set — cannot verify signature.");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (!verifyFlutterwaveSignature({ signature, secret })) {
    console.warn("[flw-webhook] Invalid verif-hash — rejecting event.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── Step 2: Parse JSON ──
  let payload: FlutterwaveWebhookPayload;
  try {
    payload = (await req.json()) as FlutterwaveWebhookPayload;
  } catch {
    console.error("[flw-webhook] Failed to parse JSON body.");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = payload.data;
  const reference = data?.tx_ref;

  // ── Step 3: Route on outcome ──
  // Flutterwave uses a single "charge.completed" event whose data.status carries
  // the outcome ("successful" | "failed").
  if (!reference) {
    console.error("[flw-webhook] event missing data.tx_ref.");
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  if (data.status !== "successful") {
    // Failed / abandoned charge — log for ops, don't mutate the order.
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.reference, reference), eq(schema.orders.status, "pending")))
      .limit(1);
    if (order) {
      logActivity({
        adminEmail: "system",
        action: "system.payment_failed",
        entityLabel: reference,
        details: { reason: data.processor_response ?? data.status ?? null, provider: "flutterwave" },
      }).catch(() => {});
    }
    return NextResponse.json({ received: true });
  }

  // ── Step 4: Promote to paid via the shared helper (idempotent) ──
  // Flutterwave amount is in naira; markOrderPaid expects kobo.
  const amountKobo = Math.round(data.amount * 100);

  try {
    const result = await markOrderPaid({ reference, amountKobo });

    if (result.kind === "not-found") {
      console.error(`[flw-webhook] Order not found for reference: ${reference}`);
      return NextResponse.json({ received: true });
    }

    if (result.kind === "amount-mismatch") {
      console.error(
        `[flw-webhook] Amount mismatch for ${reference}: ` +
          `expected ${result.expectedKobo} kobo, got ${result.receivedKobo} kobo`
      );
      return NextResponse.json({ received: true, mismatch: true });
    }

    return NextResponse.json({ received: true, idempotent: !result.transitioned });
  } catch (err) {
    console.error(`[flw-webhook] Failed to process charge.completed for ${reference}:`, err);
    // 500 so Flutterwave retries — DB failure is transient.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
