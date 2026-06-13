import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { productPayloadSchema } from "@/lib/admin/schemas";
import { logActivity } from "@/lib/admin/activityLog";
import { db } from "@/lib/db";
import {
  product_images,
  product_prep_options,
  product_variants,
  products,
} from "../../../../../drizzle/schema";

export async function POST(req: Request) {
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

  const { name, description, type, category, is_active, images, variants, prep_options } = parsed.data;
  const primaryImageUrl = images[0]?.url ?? null;

  const [created] = await db
    .insert(products)
    .values({
      name,
      description: description ?? null,
      type,
      category: type === "fresh_produce" ? category ?? null : null,
      image_url: primaryImageUrl,
      is_active,
    })
    .returning({ id: products.id });

  if (images.length > 0) {
    await db.insert(product_images).values(
      images.map((img, i) => ({
        product_id: created.id,
        url: img.url,
        key: img.key,
        sort_order: i,
      })),
    );
  }

  if (variants.length > 0) {
    await db.insert(product_variants).values(
      variants.map((v) => ({
        product_id: created.id,
        label: v.label,
        price_ngn: v.price_ngn,
        is_default: v.is_default,
      })),
    );
  }

  if (prep_options.length > 0) {
    await db.insert(product_prep_options).values(
      prep_options.map((p) => ({
        product_id: created.id,
        label: p.label,
        extra_cost_ngn: p.extra_cost_ngn,
      })),
    );
  }

  revalidateTag("shop-products");

  logActivity({
    adminEmail: session.user.email ?? "unknown",
    action: "product.created",
    entityId: created.id,
    entityLabel: name,
  }).catch(() => {});

  return NextResponse.json({ id: created.id }, { status: 201 });
}
