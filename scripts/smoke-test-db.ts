/**
 * smoke-test-db.ts
 *
 * Connectivity smoke test for the Neon database.
 * Verifies:
 *   1. SELECT 1 works via the pooled DATABASE_URL
 *   2. All 7 expected tables exist in the public schema
 *   3. Seeds ordering_config row 1 (idempotent — uses ON CONFLICT DO NOTHING)
 *
 * Usage:  npx tsx scripts/smoke-test-db.ts
 * Exit 0 on success, exit 1 on any failure.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { ordering_config } from "../drizzle/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set in .env.local");

  const sql = neon(url);

  // 1. Basic connectivity
  const rows = await sql`SELECT 1 as ok`;
  if (rows[0]?.ok !== 1) throw new Error("SELECT 1 failed");

  // 2. Verify all 7 tables exist
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  const names: string[] = tables.map((r: any) => r.table_name as string);

  const expected = [
    "admins",
    "order_items",
    "orders",
    "ordering_config",
    "product_prep_options",
    "product_variants",
    "products",
  ];
  const missing = expected.filter((n) => !names.includes(n));
  if (missing.length) {
    throw new Error("Missing tables: " + missing.join(", "));
  }

  console.log("OK — all 7 tables present:", names.join(", "));

  // 3. Seed ordering_config row 1 (idempotent)
  const db = drizzle({ client: sql });
  await db
    .insert(ordering_config)
    .values({ id: 1, is_ordering_open: true })
    .onConflictDoNothing();
  console.log("OK — ordering_config row 1 seeded (or already exists)");

  process.exit(0);
}

main().catch((e) => {
  console.error("Smoke test FAILED:", e.message || e);
  process.exit(1);
});
