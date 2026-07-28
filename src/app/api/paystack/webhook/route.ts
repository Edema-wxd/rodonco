// src/app/api/paystack/webhook/route.ts
// POST /api/paystack/webhook
//
// Handles Paystack webhook deliveries:
//  1. Read raw body via req.text() FIRST — body stream is single-pass (CONTEXT D-16)
//  2. Verify HMAC-SHA512 signature from x-paystack-signature header
//  3. Parse JSON after verification
//  4. Handle charge.success: idempotent pending → paid transition
//  5. Fire Resend emails (fire-and-forget; failures logged, not propagated)
//  6. Always return 200 to Paystack — non-200 triggers retries
//
// Security: unsigned events are rejected with 401.
// Idempotency: if order already paid, return 200 without reprocessing (CONTEXT D-17).

import "server-only";

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { verifyPaystackSignature } from "@/lib/paystack/verifySignature";
import { db, schema } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders/markOrderPaid";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { logActivity } from "@/lib/admin/activityLog";

// ─── Paystack payload types ───────────────────────────────────────────────────
// Minimal shapes covering the fields we actually use.

interface PaystackChargeData {
  reference: string;
  customer: {
    email: string;
  };
  amount: number; // kobo
  status: string; // "success" when charge.success fires
  gateway_response?: string; // reason string on charge.failed
}

interface PaystackWebhookPayload {
  event: string;
  data: PaystackChargeData;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  // ── Rate limit: 60/min per IP — before body read and HMAC to save CPU on flooded requests
  const ip = getClientIP(req);
  const rl = await rateLimit(ip, { requests: 60, window: "1 m", prefix: "rl:webhook", route: "/api/paystack/webhook" });
  if (rl.limited) return rl.response;

  // ── Step 1: Read raw body BEFORE any JSON parsing ─────────────────────────
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read request body" }, { status: 400 });
  }

  // ── Step 2: Verify HMAC signature ─────────────────────────────────────────
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";

  if (!secret) {
    // Misconfiguration — log and fail closed
    console.error("[webhook] PAYSTACK_SECRET_KEY is not set — cannot verify signature.");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const isValid = verifyPaystackSignature({ rawBody, signature, secret });
  if (!isValid) {
    console.warn("[webhook] Invalid signature — rejecting event.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── Step 3: Parse JSON ────────────────────────────────────────────────────
  let payload: PaystackWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    console.error("[webhook] Failed to parse JSON body after signature check.");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Step 4: Route on event type ───────────────────────────────────────────
  if (payload.event === "charge.failed") {
    const ref = payload.data?.reference;
    if (ref) {
      const [order] = await db
        .select()
        .from(schema.orders)
        .where(and(eq(schema.orders.reference, ref), eq(schema.orders.status, "pending")))
        .limit(1);
      if (order) {
        logActivity({
          adminEmail: "system",
          action: "system.payment_failed",
          entityLabel: ref,
          details: { reason: payload.data.gateway_response ?? null },
        }).catch(() => {});
      }
    }
    return NextResponse.json({ received: true });
  }

  if (payload.event === "refund.processed") {
    const ref = payload.data?.reference;
    if (ref) {
      const [order] = await db
        .select()
        .from(schema.orders)
        .where(and(eq(schema.orders.reference, ref), eq(schema.orders.status, "paid")))
        .limit(1);
      if (order) {
        await db
          .update(schema.orders)
          .set({ status: "refunded" })
          .where(eq(schema.orders.id, order.id));
        logActivity({
          adminEmail: "system",
          action: "order.refunded",
          entityId: order.id,
          entityLabel: ref,
          details: { amount_kobo: payload.data.amount },
        }).catch(() => {});
      }
    }
    return NextResponse.json({ received: true });
  }

  if (payload.event === "charge.dispute.create") {
    const ref = payload.data?.reference;
    logActivity({
      adminEmail: "system",
      action: "system.payment_disputed",
      entityLabel: ref ?? undefined,
      details: { amount_kobo: payload.data.amount },
    }).catch(() => {});
    return NextResponse.json({ received: true });
  }

  if (payload.event !== "charge.success") {
    // Silently acknowledge all other unhandled event types
    return NextResponse.json({ received: true });
  }

  const reference = payload.data?.reference;
  if (!reference) {
    console.error("[webhook] charge.success event missing data.reference.");
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  // ── Step 5: Promote to paid via the shared helper (idempotent) ────────────
  // Same code path the confirmation page uses for its direct-verify fallback,
  // so the amount check, atomic transition, and receipt emails stay in sync.
  try {
    const result = await markOrderPaid({ reference, amountKobo: payload.data.amount });

    if (result.kind === "not-found") {
      // Reference not in our DB — 200, no retry value.
      console.error(`[webhook] Order not found for reference: ${reference}`);
      return NextResponse.json({ received: true });
    }

    if (result.kind === "amount-mismatch") {
      console.error(
        `[webhook] Amount mismatch for ${reference}: ` +
          `expected ${result.expectedKobo} kobo, got ${result.receivedKobo} kobo`
      );
      // 200 so Paystack does not retry; mismatch is logged inside the helper.
      return NextResponse.json({ received: true, mismatch: true });
    }

    // Paid — emails fired inside the helper only on the winning transition.
    return NextResponse.json({ received: true, idempotent: !result.transitioned });
  } catch (err) {
    console.error(`[webhook] Failed to process charge.success for ${reference}:`, err);
    // Return 500 so Paystack retries — DB failure is transient.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
