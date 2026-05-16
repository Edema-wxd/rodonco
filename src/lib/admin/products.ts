import "server-only";

import { asc, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { products, product_prep_options, product_variants, product_images } from "../../../drizzle/schema";

export type AdminProductImage = {
  id: string;
  url: string;
  key: string;
  sort_order: number;
};

export type AdminProductVariant = {
  id: string;
  label: string;
  price_ngn: number;
  is_default: boolean;
};

export type AdminProductPrepOption = {
  id: string;
  label: string;
  extra_cost_ngn: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_active: boolean;
  images: AdminProductImage[];
  variants: AdminProductVariant[];
  prep_options: AdminProductPrepOption[];
};

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const [productRows, variantRows, prepRows, imageRows] = await Promise.all([
    db.select().from(products).orderBy(desc(products.created_at)),
    db.select().from(product_variants),
    db.select().from(product_prep_options),
    db.select().from(product_images).orderBy(asc(product_images.sort_order)),
  ]);

  const variantsByProduct = new Map<string, AdminProductVariant[]>();
  for (const v of variantRows) {
    const list = variantsByProduct.get(v.product_id) ?? [];
    list.push({ id: v.id, label: v.label, price_ngn: v.price_ngn, is_default: v.is_default });
    variantsByProduct.set(v.product_id, list);
  }

  const prepByProduct = new Map<string, AdminProductPrepOption[]>();
  for (const p of prepRows) {
    const list = prepByProduct.get(p.product_id) ?? [];
    list.push({ id: p.id, label: p.label, extra_cost_ngn: p.extra_cost_ngn });
    prepByProduct.set(p.product_id, list);
  }

  const imagesByProduct = new Map<string, AdminProductImage[]>();
  for (const img of imageRows) {
    const list = imagesByProduct.get(img.product_id) ?? [];
    list.push({ id: img.id, url: img.url, key: img.key, sort_order: img.sort_order });
    imagesByProduct.set(img.product_id, list);
  }

  return productRows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    type: p.type,
    is_active: p.is_active,
    images: imagesByProduct.get(p.id) ?? [],
    variants: variantsByProduct.get(p.id) ?? [],
    prep_options: prepByProduct.get(p.id) ?? [],
  }));
}
