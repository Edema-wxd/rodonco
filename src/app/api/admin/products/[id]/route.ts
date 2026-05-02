import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { productPayloadSchema } from "@/lib/admin/schemas";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { product_prep_options, product_variants, products } from "../../../../../../drizzle/schema";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = productPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await params;
  const { name, description, type, image_url, is_active, variants, prep_options } = parsed.data;

  // Sequential statements (replace-all for variants/prep options).
  await db
    .update(products)
    .set({
      name,
      description: description ?? null,
      type,
      image_url: image_url ?? null,
      is_active,
    })
    .where(eq(products.id, id));

  await db.delete(product_variants).where(eq(product_variants.product_id, id));
  if (variants.length > 0) {
    await db.insert(product_variants).values(
      variants.map((v) => ({
        product_id: id,
        label: v.label,
        price_ngn: v.price_ngn,
        is_default: v.is_default,
      })),
    );
  }

  await db.delete(product_prep_options).where(eq(product_prep_options.product_id, id));
  if (prep_options.length > 0) {
    await db.insert(product_prep_options).values(
      prep_options.map((p) => ({
        product_id: id,
        label: p.label,
        extra_cost_ngn: p.extra_cost_ngn,
      })),
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  // FK ON DELETE CASCADE removes variants + prep options.
  await db.delete(products).where(eq(products.id, id));

  return NextResponse.json({ ok: true });
}

