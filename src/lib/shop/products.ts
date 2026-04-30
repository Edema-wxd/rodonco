import "server-only";

import { asc, eq, inArray, sql } from "drizzle-orm";

import type { Product } from "@/types";
import { db, schema } from "@/lib/db";

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(0).toISOString();
}

export async function getActiveProductsForShop(): Promise<Product[]> {
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
    image_url: row.image_url ?? null,
    is_active: row.is_active,
    created_at: toIsoString(row.created_at),
  }));
}

export type ActiveProductWithStartingPrice = Product & {
  starting_price_ngn: number;
};

export async function getActiveProductsWithStartingPriceForShop(): Promise<
  ActiveProductWithStartingPrice[]
> {
  const products = await getActiveProductsForShop();
  const productIds = products.map((p) => p.id);

  if (productIds.length === 0) return [];

  const minPrices = await db
    .select({
      product_id: schema.product_variants.product_id,
      starting_price_ngn: sql<number>`min(${schema.product_variants.price_ngn})`,
    })
    .from(schema.product_variants)
    .where(inArray(schema.product_variants.product_id, productIds))
    .groupBy(schema.product_variants.product_id);

  const priceByProductId = new Map<string, number>();
  for (const row of minPrices) {
    priceByProductId.set(row.product_id, row.starting_price_ngn);
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
      starting_price_ngn: startingPrice ?? 0,
    };
  });
}

