// src/app/api/orders/init/route.ts
// POST /api/orders/init — create or reuse a pending order, initialize Paystack.
//
// Flow:
//  1. Parse + validate request body (checkout fields + cart items)
//  2. Check ordering is open (consistent read via getOrderingConfig, no cache)
//  3. Compute cart total in kobo from submitted items (server recomputes — threat model)
//  4. Attempt to reuse existing pending order (D-05)
//  5. If no reuse: generate reference, insert order + order_items in DB
//  6. Call Paystack initialize with the reference
//  7. Return { reference, access_code, amount_kobo }

import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, inArray } from "drizzle-orm";

import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { snapToWeekStart } from "@/lib/admin/week";
import { db, schema } from "@/lib/db";
import { findPendingReuse } from "@/lib/orders/findPendingReuse";
import { initializePaystackTransaction } from "@/lib/paystack/initialize";
import { initializeFlutterwaveTransaction } from "@/lib/flutterwave/initialize";
import { buildOrderItemsDraftFromCart } from "@/lib/checkout/cartToOrderDraft";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

// ─────────────────────────────────────────
// Request validation schema
// ─────────────────────────────────────────

const nigerianPhoneRegex = /^0[7-9][0-9]{9}$/;

const cartItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  variantLabel: z.string().nullable(),
  prepOption: z.string().nullable(),
  quantity: z.number().int().positive(),
  unitPriceNgn: z.number().int().nonnegative(),
  subtotalNgn: z.number().int().nonnegative(),
});

const initOrderSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("A valid email address is required"),
  phone: z
    .string()
    .regex(nigerianPhoneRegex, "Enter a valid 11-digit Nigerian mobile number"),
  delivery_area: z.string().min(1).max(100).optional(),
  delivery_address: z.string().min(1, "Delivery address is required").max(500),
  allergy_notes: z.string().max(500).nullable().optional(),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to proceed" }),
  }),
  // Which payment gateway to use. Defaults to Paystack; "flutterwave" is the
  // alternative provider (only offered when FLW_SECRET_KEY is configured).
  provider: z.enum(["paystack", "flutterwave"]).optional().default("paystack"),
  cart: z.array(cartItemSchema).min(1, "Cart must not be empty"),
});

export type InitOrderRequest = z.infer<typeof initOrderSchema>;

// ─────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  // Rate limiting: 5/min and 20/hr per IP — checked in parallel before any DB or Paystack work
  const ip = getClientIP(req);
  const [perMinute, perHour] = await Promise.all([
    rateLimit(ip, { requests: 5, window: "1 m", prefix: "rl:orders-init:minute", route: "/api/orders/init (5/min)" }),
    rateLimit(ip, { requests: 20, window: "1 h", prefix: "rl:orders-init:hour", route: "/api/orders/init (20/hr)" }),
  ]);
  if (perMinute.limited) return perMinute.response;
  if (perHour.limited) return perHour.response;

  // 1. Parse + validate JSON body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = initOrderSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, phone, delivery_area, delivery_address, allergy_notes, provider, cart } = parsed.data;

  // Guard: the Flutterwave option should only ever reach us when the gateway is
  // configured. If a client sends provider=flutterwave without a secret key,
  // fail fast with a clear message rather than a generic 503 later.
  if (provider === "flutterwave" && !process.env.FLW_SECRET_KEY) {
    return NextResponse.json(
      { error: "This payment method is not available right now. Please use card payment." },
      { status: 422 }
    );
  }

  // 2. Enforce ordering window (consistent read, no stale cache)
  const config = await getOrderingConfig();
  if (!config.is_ordering_open) {
    return NextResponse.json(
      { error: "Ordering is currently closed. Please check back later." },
      { status: 422 }
    );
  }

  // week_of snapped to Sunday so it aligns with prep-list / manifest queries
  const weekOf = snapToWeekStart(config.next_delivery_date ?? new Date().toISOString().slice(0, 10));

  // Resolve delivery fee: zone-specific price takes precedence over the flat fee
  const zones = (config.delivery_zones ?? []) as { area: string; fee_ngn: number }[];
  const matchedZone = delivery_area
    ? zones.find((z) => z.area === delivery_area)
    : undefined;
  const deliveryFeeNgn = matchedZone ? matchedZone.fee_ngn : config.delivery_fee_ngn;

  // 3. Server-side price authority: fetch canonical prices from DB (CR-02 fix)
  const productIds = [...new Set(cart.map((i) => i.productId))];

  let totalNgn: number;
  let pricedCart: typeof cart;

  try {
    const [dbVariants, dbPrepOptions] = await Promise.all([
      db
        .select()
        .from(schema.product_variants)
        .where(inArray(schema.product_variants.product_id, productIds)),
      db
        .select()
        .from(schema.product_prep_options)
        .where(inArray(schema.product_prep_options.product_id, productIds)),
    ]);

    let runningTotal = 0;
    const computed = cart.map((item) => {
      const variant =
        item.variantLabel !== null
          ? dbVariants.find(
              (v) => v.product_id === item.productId && v.label === item.variantLabel
            )
          : dbVariants.find(
              (v) => v.product_id === item.productId && v.is_default === true
            );

      if (!variant) {
        throw new Error(`Unknown variant for product ${item.productId}`);
      }

      const prep =
        item.prepOption !== null
          ? dbPrepOptions.find(
              (p) => p.product_id === item.productId && p.label === item.prepOption
            )
          : null;

      const unitPrice = variant.price_ngn + (prep?.extra_cost_ngn ?? 0);
      const subtotal = unitPrice * item.quantity;
      runningTotal += subtotal;

      return { ...item, unitPriceNgn: unitPrice, subtotalNgn: subtotal };
    });

    totalNgn = runningTotal + deliveryFeeNgn;
    pricedCart = computed;
  } catch (err) {
    console.error("[/api/orders/init] Price lookup failed:", err);
    return NextResponse.json(
      {
        error:
          "One or more items could not be priced. Please refresh your cart and try again.",
      },
      { status: 422 }
    );
  }

  // 4. Try to reuse existing pending order (D-05)
  const existingOrder = await findPendingReuse(email, pricedCart);

  // Prefer explicit env var (set in Vercel to https://www.rodoandco.com).
  // Fall back to the request Origin header (always has protocol).
  // x-forwarded-host is a last resort but lacks the scheme, so we prepend https.
  const rawHost =
    req.headers.get("origin") ??
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "";
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (rawHost.startsWith("http") ? rawHost : `https://${rawHost}`);

  // Kick off payment with the chosen gateway and return the client-facing payload.
  // Shared by the reuse path and the new-order path so both providers behave
  // identically. Returns a NextResponse (success or 503 on gateway failure).
  async function startPayment(ref: string): Promise<NextResponse> {
    const amountKobo = totalNgn * 100;
    try {
      if (provider === "flutterwave") {
        const flw = await initializeFlutterwaveTransaction({
          email,
          amountNgn: totalNgn,
          reference: ref,
          redirect_url: `${origin}/order/${ref}`,
          name,
          phone,
          meta: { customer_name: name, phone },
        });
        return NextResponse.json({
          reference: ref,
          provider: "flutterwave",
          redirect_url: flw.link,
          amount_kobo: amountKobo,
        });
      }

      const paystack = await initializePaystackTransaction({
        email,
        amount: amountKobo,
        reference: ref,
        callback_url: `${origin}/order/${ref}`,
        metadata: { customer_name: name, phone },
      });
      return NextResponse.json({
        reference: ref,
        provider: "paystack",
        access_code: paystack.access_code,
        authorization_url: paystack.authorization_url,
        amount_kobo: amountKobo,
      });
    } catch (err) {
      console.error(
        `[/api/orders/init] ${provider} initialization error:`,
        err instanceof Error ? err.message : err
      );
      return NextResponse.json(
        { error: "Payment provider unavailable. Please try again." },
        { status: 503 }
      );
    }
  }

  if (existingOrder) {
    // Reuse: skip DB insert, go straight to Paystack init.
    // Always use the freshly computed totalNgn so the delivery fee and current
    // prices are reflected even if the stored order pre-dates them.
    // Sync total_ngn and payment_method first so the webhook amount-check matches
    // what the gateway charges and the confirmation-page verify hits the right provider.
    if (existingOrder.total_ngn !== totalNgn || existingOrder.payment_method !== provider) {
      try {
        await db
          .update(schema.orders)
          .set({ total_ngn: totalNgn, payment_method: provider })
          .where(eq(schema.orders.id, existingOrder.id));
      } catch (err) {
        console.warn("[/api/orders/init] Could not sync reused order:", err);
      }
    }

    return startPayment(existingOrder.reference);
  }

  // 5. Create a new pending order
  const reference = `RDC-${nanoid(10)}`;

  let newOrderId: string;

  try {
    const [insertedOrder] = await db
      .insert(schema.orders)
      .values({
        reference,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        delivery_address,
        delivery_area: delivery_area ?? null,
        allergy_notes: allergy_notes ?? null,
        status: "pending",
        payment_method: provider,
        total_ngn: totalNgn,
        week_of: weekOf,
      })
      .returning({ id: schema.orders.id, reference: schema.orders.reference });

    newOrderId = insertedOrder.id;

    // Insert order items
    const itemDrafts = buildOrderItemsDraftFromCart(pricedCart, newOrderId);
    await db.insert(schema.order_items).values(itemDrafts);

    // Option A auto-cleanup: delete any abandoned_carts rows for this email so
    // converted customers don't appear in the abandoned carts admin view.
    db.delete(schema.abandoned_carts)
      .where(eq(schema.abandoned_carts.customer_email, email))
      .catch((err) =>
        console.warn("[/api/orders/init] Could not clean up abandoned_carts:", err),
      );
  } catch (err) {
    console.error("[/api/orders/init] DB insert error:", err);
    return NextResponse.json(
      { error: "Could not create order. Please try again." },
      { status: 500 }
    );
  }

  // 6. Initialize the payment with the chosen gateway
  return startPayment(reference);
}
