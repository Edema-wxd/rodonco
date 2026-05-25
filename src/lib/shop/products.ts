import "server-only";

import { asc, eq, inArray, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import type { Product } from "@/types";
import { db, schema } from "@/lib/db";

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(0).toISOString();
}

export async function getActiveProductsForShop(): Promise<Product[]> {
  return unstable_cache(
    async () => {
      const rows = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.is_active, true))
        .orderBy(asc(schema.products.name));

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? null,
        type: row.type as Product["type"],
        category: (row.category as Product["category"]) ?? null,
        image_url: row.image_url ?? null,
        images: [],
        is_active: row.is_active,
        created_at: toIsoString(row.created_at),
      }));
    },
    ["shop-active-products-v1"],
    { tags: ["shop-products"] },
  )();
}

export type ActiveProductWithStartingPrice = Product & {
  starting_price_ngn: number;
};

export async function getActiveProductsWithStartingPriceForShop(): Promise<
  ActiveProductWithStartingPrice[]
> {
  return unstable_cache(
    async () => {
      const rows = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.is_active, true))
        .orderBy(asc(schema.products.name));

      const products = rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? null,
        type: row.type as Product["type"],
        category: (row.category as Product["category"]) ?? null,
        image_url: row.image_url ?? null,
        images: [],
        is_active: row.is_active,
        created_at: toIsoString(row.created_at),
      }));

      const productIds = products.map((p) => p.id);

      if (productIds.length === 0) return [];

      const [minPrices, imageRows] = await Promise.all([
        db
          .select({
            product_id: schema.product_variants.product_id,
            starting_price_ngn: sql<number>`min(${schema.product_variants.price_ngn})`,
          })
          .from(schema.product_variants)
          .where(inArray(schema.product_variants.product_id, productIds))
          .groupBy(schema.product_variants.product_id),
        db
          .select({
            product_id: schema.product_images.product_id,
            url: schema.product_images.url,
          })
          .from(schema.product_images)
          .where(inArray(schema.product_images.product_id, productIds))
          .orderBy(asc(schema.product_images.sort_order)),
      ]);

      const priceByProductId = new Map<string, number>();
      for (const row of minPrices) {
        priceByProductId.set(row.product_id, row.starting_price_ngn);
      }

      const imagesByProductId = new Map<string, { url: string }[]>();
      for (const img of imageRows) {
        const list = imagesByProductId.get(img.product_id) ?? [];
        list.push({ url: img.url });
        imagesByProductId.set(img.product_id, list);
      }

      return products.map((product) => {
        const startingPrice = priceByProductId.get(product.id);
        if (startingPrice == null) {
          console.error(
            `[getActiveProductsWithStartingPriceForShop] Missing variants for product_id=${product.id}; defaulting starting_price_ngn=0`,
          );
        }

        return {
          ...product,
          images: imagesByProductId.get(product.id) ?? [],
          starting_price_ngn: startingPrice ?? 0,
        };
      });
    },
    ["shop-active-products-with-price-v1"],
    { tags: ["shop-products"] },
  )();
}
