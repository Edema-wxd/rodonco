// POST /api/orders/draft — capture customer info + cart into abandoned_carts for outreach.
// Called at checkout step 1 so we have the data even if the customer never pays.

import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { db, schema } from "@/lib/db";

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

const draftSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().regex(nigerianPhoneRegex),
  delivery_address: z.string().min(1).max(500),
  allergy_notes: z.string().max(500).nullable().optional(),
  terms: z.literal(true),
  cart: z.array(cartItemSchema).min(1),
});

export async function POST(req: Request): Promise<NextResponse> {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = draftSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, phone, delivery_address, allergy_notes, cart } = parsed.data;

  const subtotalNgn = cart.reduce((sum, item) => sum + item.subtotalNgn, 0);

  try {
    await db.insert(schema.abandoned_carts).values({
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      delivery_address,
      allergy_notes: allergy_notes ?? null,
      cart_items: cart,
      subtotal_ngn: subtotalNgn,
    });
  } catch (err) {
    console.error("[/api/orders/draft] DB insert error:", err);
    return NextResponse.json(
      { error: "Could not save your details. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
