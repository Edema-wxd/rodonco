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
import { inArray } from "drizzle-orm";

import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { db, schema } from "@/lib/db";
import { findPendingReuse } from "@/lib/orders/findPendingReuse";
import { initializePaystackTransaction } from "@/lib/paystack/initialize";
import { buildOrderItemsDraftFromCart } from "@/lib/checkout/cartToOrderDraft";

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
  delivery_address: z.string().min(1, "Delivery address is required").max(500),
  allergy_notes: z.string().max(500).nullable().optional(),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to proceed" }),
  }),
  cart: z.array(cartItemSchema).min(1, "Cart must not be empty"),
});

export type InitOrderRequest = z.infer<typeof initOrderSchema>;

// ─────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
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

  const { name, email, phone, delivery_address, allergy_notes, cart } = parsed.data;

  // 2. Enforce ordering window (consistent read, no stale cache)
  const config = await getOrderingConfig();
  if (!config.is_ordering_open) {
    return NextResponse.json(
      { error: "Ordering is currently closed. Please check back later." },
      { status: 422 }
    );
  }

  // week_of from DB config (falls back to today's ISO date if missing)
  const weekOf = config.next_delivery_date ?? new Date().toISOString().slice(0, 10);

  // 3. Server-side price authority: fetch canonical prices from DB (CR-02 fix)
  const productIds = [...new Set(cart.map((i) => i.productId))];

  let totalKobo: number;
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

    totalKobo = runningTotal;
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

  if (existingOrder) {
    // Reuse: skip DB insert, go straight to Paystack init
    try {
      const paystackResult = await initializePaystackTransaction({
        email,
        amount: existingOrder.total_ngn,
        reference: existingOrder.reference,
        metadata: { customer_name: name, phone },
      });

      return NextResponse.json({
        reference: existingOrder.reference,
        access_code: paystackResult.access_code,
        amount_kobo: existingOrder.total_ngn,
      });
    } catch (err) {
      console.error("[/api/orders/init] Paystack error on reused order:", err);
      return NextResponse.json(
        { error: "Payment provider unavailable. Please try again." },
        { status: 503 }
      );
    }
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
        allergy_notes: allergy_notes ?? null,
        status: "pending",
        total_ngn: totalKobo,
        week_of: weekOf,
      })
      .returning({ id: schema.orders.id, reference: schema.orders.reference });

    newOrderId = insertedOrder.id;

    // Insert order items
    const itemDrafts = buildOrderItemsDraftFromCart(pricedCart, newOrderId);
    await db.insert(schema.order_items).values(itemDrafts);
  } catch (err) {
    console.error("[/api/orders/init] DB insert error:", err);
    return NextResponse.json(
      { error: "Could not create order. Please try again." },
      { status: 500 }
    );
  }

  // 6. Initialize Paystack transaction
  try {
    const paystackResult = await initializePaystackTransaction({
      email,
      amount: totalKobo,
      reference,
      metadata: { customer_name: name, phone },
    });

    return NextResponse.json({
      reference,
      access_code: paystackResult.access_code,
      amount_kobo: totalKobo,
    });
  } catch (err) {
    console.error("[/api/orders/init] Paystack initialization error:", err);
    return NextResponse.json(
      { error: "Payment provider unavailable. Please try again." },
      { status: 503 }
    );
  }
}
