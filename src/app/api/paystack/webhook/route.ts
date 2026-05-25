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
import { sendOrderEmails } from "@/lib/email/sendOrderEmails";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

// ─── Paystack payload types ───────────────────────────────────────────────────
// Minimal shapes covering the fields we actually use.

interface PaystackChargeData {
  reference: string;
  customer: {
    email: string;
  };
  amount: number; // kobo
  status: string; // "success" when charge.success fires
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
  if (payload.event !== "charge.success") {
    // Silently acknowledge unhandled event types — Paystack sends various events
    return NextResponse.json({ received: true });
  }

  const reference = payload.data?.reference;
  if (!reference) {
    console.error("[webhook] charge.success event missing data.reference.");
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  // ── Step 5: Idempotency check — bail early if already paid ────────────────
  const [existingOrder] = await db
    .select()
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.reference, reference),
        eq(schema.orders.status, "paid")
      )
    )
    .limit(1);

  if (existingOrder) {
    // Already processed — return 200 without reprocessing
    return NextResponse.json({ received: true, idempotent: true });
  }

  // ── Step 6: Fetch pending order for this reference ────────────────────────
  const [pendingOrder] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.reference, reference))
    .limit(1);

  if (!pendingOrder) {
    // Reference not found in our DB — log and return 200 (no retry value)
    console.error(`[webhook] Order not found for reference: ${reference}`);
    return NextResponse.json({ received: true });
  }

  // ── Step 6b: Verify charged amount matches stored order total ─────────────
  // total_ngn is stored in NGN; Paystack sends amount in kobo — multiply by 100.
  if (payload.data.amount !== pendingOrder.total_ngn * 100) {
    console.error(
      `[webhook] Amount mismatch for ${reference}: ` +
        `expected ${pendingOrder.total_ngn * 100} kobo, got ${payload.data.amount} kobo`
    );
    // Return 200 so Paystack does not retry; mismatch flagged for ops monitoring.
    return NextResponse.json({ received: true, mismatch: true });
  }

  // ── Step 7: Transition order to paid ─────────────────────────────────────
  let updatedOrder: typeof schema.orders.$inferSelect;

  try {
    const [result] = await db
      .update(schema.orders)
      .set({ status: "paid" })
      .where(
        and(
          eq(schema.orders.reference, reference),
          eq(schema.orders.status, "pending")
        )
      )
      .returning();

    if (!result) {
      // Race condition: another webhook delivery won the update — idempotent path
      console.warn(`[webhook] Order ${reference} status update returned no rows (race condition).`);
      return NextResponse.json({ received: true });
    }

    updatedOrder = result;
  } catch (err) {
    console.error(`[webhook] DB update failed for reference ${reference}:`, err);
    // Return 500 so Paystack retries — DB failure is transient
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  // ── Step 8: Fetch order items for email ───────────────────────────────────
  const items = await db
    .select()
    .from(schema.order_items)
    .where(eq(schema.order_items.order_id, updatedOrder.id));

  // ── Step 9: Fire-and-forget emails ────────────────────────────────────────
  // get next_delivery_date from ordering_config for the customer receipt
  let nextDeliveryDate: string;
  try {
    const config = await getOrderingConfig();
    nextDeliveryDate = config.next_delivery_date ?? updatedOrder.week_of;
  } catch {
    // Fallback to the week_of stored at order creation time
    nextDeliveryDate = updatedOrder.week_of;
  }

  // Cast DB row to domain type for email helper
  const orderForEmail = {
    id: updatedOrder.id,
    reference: updatedOrder.reference,
    customer_name: updatedOrder.customer_name,
    customer_email: updatedOrder.customer_email,
    customer_phone: updatedOrder.customer_phone,
    delivery_address: updatedOrder.delivery_address,
    allergy_notes: updatedOrder.allergy_notes,
    status: updatedOrder.status as "paid",
    total_ngn: updatedOrder.total_ngn,
    week_of: updatedOrder.week_of,
    created_at: updatedOrder.created_at.toISOString(),
    notified_at: updatedOrder.notified_at?.toISOString() ?? null,
  };

  const itemsForEmail = items.map((item) => ({
    id: item.id,
    order_id: item.order_id,
    product_id: item.product_id,
    product_name: item.product_name,
    variant_label: item.variant_label,
    prep_option: item.prep_option,
    quantity: item.quantity,
    unit_price_ngn: item.unit_price_ngn,
    subtotal_ngn: item.subtotal_ngn,
  }));

  // Non-blocking: webhook response must not wait on email delivery
  void sendOrderEmails({ order: orderForEmail, items: itemsForEmail, nextDeliveryDate });

  // ── Step 10: Return 200 ───────────────────────────────────────────────────
  return NextResponse.json({ received: true });
}
