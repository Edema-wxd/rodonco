import "server-only";

import { asc, eq } from "drizzle-orm";

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

