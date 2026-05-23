import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";

export type OrderingConfigRow = {
  id: number;
  is_ordering_open: boolean;
  cutoff_message: string | null;
  next_delivery_date: string | null;
  delivery_fee_ngn: number;
  updated_at: Date;
};

export type SiteSettingsRow = {
  id: number;
  whatsapp_number: string | null;
  contact_email: string | null;
  instagram_handle: string | null;
  updated_at: Date;
};

export async function getSiteSettings(): Promise<SiteSettingsRow | null> {
  const [row] = await db
    .select()
    .from(schema.site_settings)
    .where(eq(schema.site_settings.id, 1))
    .limit(1);

  return row ?? null;
}

export async function getOrderingConfig(): Promise<OrderingConfigRow> {
  const [row] = await db
    .select()
    .from(schema.ordering_config)
    .where(eq(schema.ordering_config.id, 1))
    .limit(1);

  if (!row) {
    throw new Error("Missing ordering_config row id=1");
  }

  return {
    id: row.id,
    is_ordering_open: row.is_ordering_open,
    cutoff_message: row.cutoff_message ?? null,
    next_delivery_date: row.next_delivery_date ?? null,
    delivery_fee_ngn: row.delivery_fee_ngn,
    updated_at: row.updated_at,
  };
}

