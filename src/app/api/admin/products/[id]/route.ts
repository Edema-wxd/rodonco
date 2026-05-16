import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

import { auth } from "@/auth";
import { productPayloadSchema } from "@/lib/admin/schemas";
import { db } from "@/lib/db";
import {
  product_images,
  product_prep_options,
  product_variants,
  products,
} from "../../../../../../drizzle/schema";

const utapi = new UTApi();

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
  const { name, description, type, is_active, images, variants, prep_options } = parsed.data;
  const primaryImageUrl = images[0]?.url ?? null;

  // Update core product fields
  await db
    .update(products)
    .set({ name, description: description ?? null, type, image_url: primaryImageUrl, is_active })
    .where(eq(products.id, id));

  // ── Images diff ───────────────────────────────────────────────────
  const existingImages = await db
    .select()
    .from(product_images)
    .where(eq(product_images.product_id, id));

  const payloadIds = new Set(images.filter((i) => i.id).map((i) => i.id));
  const toDelete = existingImages.filter((i) => !payloadIds.has(i.id));

  if (toDelete.length > 0) {
    await utapi.deleteFiles(toDelete.map((i) => i.key));
    await db
      .delete(product_images)
      .where(inArray(product_images.id, toDelete.map((i) => i.id)));
  }

  // Update sort_order for retained images
  for (const img of images.filter((i) => i.id)) {
    await db
      .update(product_images)
      .set({ sort_order: img.sort_order })
      .where(eq(product_images.id, img.id!));
  }

  // Insert new images (no id = not yet in DB)
  const newImages = images.filter((i) => !i.id);
  if (newImages.length > 0) {
    await db.insert(product_images).values(
      newImages.map((img) => ({
        product_id: id,
        url: img.url,
        key: img.key,
        sort_order: img.sort_order,
      })),
    );
  }

  // ── Variants replace-all ──────────────────────────────────────────
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

  // ── Prep options replace-all ──────────────────────────────────────
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

  // Fetch images before cascade-delete so we can clean up UploadThing
  const imagesToDelete = await db
    .select({ key: product_images.key })
    .from(product_images)
    .where(eq(product_images.product_id, id));

  if (imagesToDelete.length > 0) {
    await utapi.deleteFiles(imagesToDelete.map((i) => i.key));
  }

  // FK ON DELETE CASCADE removes variants, prep_options, and product_images
  await db.delete(products).where(eq(products.id, id));

  return NextResponse.json({ ok: true });
}
