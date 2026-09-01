import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db, schema } from "@/lib/db";
import type { PrepOption, Product, ProductVariant } from "@/types";

type ProductDetails = {
  product: Product;
  variants: ProductVariant[];
  prepOptions: PrepOption[];
};

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(0).toISOString();
}

export async function getProductDetailsById(productId: string): Promise<ProductDetails | null> {
  return unstable_cache(
    async () => {
      const [productRow] = await db
        .select()
        .from(schema.products)
        .where(and(eq(schema.products.id, productId), eq(schema.products.is_active, true)))
        .limit(1);

      if (!productRow) return null;

      const [variantRows, prepRows, imageRows] = await Promise.all([
        db
          .select()
          .from(schema.product_variants)
          .where(eq(schema.product_variants.product_id, productId))
          .orderBy(asc(schema.product_variants.label)),
        db
          .select()
          .from(schema.product_prep_options)
          .where(eq(schema.product_prep_options.product_id, productId)),
        db
          .select({ url: schema.product_images.url })
          .from(schema.product_images)
          .where(eq(schema.product_images.product_id, productId))
          .orderBy(asc(schema.product_images.sort_order)),
      ]);

      return {
        product: {
          id: productRow.id,
          name: productRow.name,
          description: productRow.description ?? null,
          type: productRow.type as Product["type"],
          category: (productRow.category as Product["category"]) ?? null,
          image_url: productRow.image_url ?? null,
          images: imageRows.map((r) => ({ url: r.url })),
          is_active: productRow.is_active,
          coming_soon: productRow.coming_soon,
          created_at: toIsoString(productRow.created_at),
        },
        variants: variantRows.map((v) => ({
          id: v.id,
          product_id: v.product_id,
          label: v.label,
          price_ngn: v.price_ngn,
          is_default: v.is_default,
        })),
        prepOptions: prepRows.map((p) => ({
          id: p.id,
          product_id: p.product_id,
          label: p.label,
          extra_cost_ngn: p.extra_cost_ngn,
        })),
      };
    },
    ["shop-product-details-v2", productId],
    { tags: ["shop-products"] },
  )();
}
