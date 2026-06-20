import "server-only";

import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db, schema } from "@/lib/db";
import type { DeliveryZone } from "@/lib/admin/config";

export type { DeliveryZone };

export type OrderingConfig = {
  is_ordering_open: boolean;
  cutoff_message: string | null;
  next_delivery_date: string | null;
  delivery_fee_ngn: number;
  delivery_zones: DeliveryZone[];
};

const SAFE_DEFAULT: OrderingConfig = {
  // Safe default: if the DB row is missing or unreadable, prefer keeping the shop
  // usable rather than hard-blocking customers.
  is_ordering_open: true,
  cutoff_message: null,
  next_delivery_date: null,
  delivery_fee_ngn: 0,
  delivery_zones: [],
};

async function readOrderingConfigFromDb(): Promise<OrderingConfig> {
  try {
    const [row] = await db
      .select()
      .from(schema.ordering_config)
      .where(eq(schema.ordering_config.id, 1))
      .limit(1);

    if (!row) {
      console.error(
        "[getOrderingConfig] Missing `ordering_config` row for id=1; defaulting ordering to OPEN",
      );
      return SAFE_DEFAULT;
    }

    return {
      is_ordering_open: row.is_ordering_open,
      cutoff_message: row.cutoff_message ?? null,
      next_delivery_date: row.next_delivery_date ?? null,
      delivery_fee_ngn: row.delivery_fee_ngn,
      delivery_zones: (row.delivery_zones as DeliveryZone[] | null) ?? [],
    };
  } catch (err) {
    console.warn("[getOrderingConfig] DB unavailable (likely cold start); defaulting ordering to OPEN");
    return SAFE_DEFAULT;
  }
}

const getOrderingConfigCached = unstable_cache(
  async () => readOrderingConfigFromDb(),
  ["shop-ordering-config-v2"],
  {
    tags: ["ordering-config"],
  }
);

export async function getOrderingConfig(): Promise<OrderingConfig> {
  const config = await getOrderingConfigCached();
  // Guard against stale cache entries written before delivery_zones was added.
  return { ...config, delivery_zones: config.delivery_zones ?? [] };
}

