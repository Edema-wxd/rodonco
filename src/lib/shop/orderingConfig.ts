import "server-only";

import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db, schema } from "@/lib/db";

export type OrderingConfig = {
  is_ordering_open: boolean;
  cutoff_message: string | null;
  next_delivery_date: string | null;
};

const SAFE_DEFAULT: OrderingConfig = {
  // Safe default: if the DB row is missing or unreadable, prefer keeping the shop
  // usable rather than hard-blocking customers.
  is_ordering_open: true,
  cutoff_message: null,
  next_delivery_date: null,
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
    };
  } catch (err) {
    console.warn("[getOrderingConfig] DB unavailable (likely cold start); defaulting ordering to OPEN");
    return SAFE_DEFAULT;
  }
}

const getOrderingConfigCached = unstable_cache(
  async () => readOrderingConfigFromDb(),
  ["shop-ordering-config-v1"],
  {
    // Keep UI snappy, while still reflecting admin changes quickly.
    revalidate: 15,
  }
);

export async function getOrderingConfig(): Promise<OrderingConfig> {
  return getOrderingConfigCached();
}

