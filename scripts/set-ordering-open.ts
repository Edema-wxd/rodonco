/**
 * One-off: sets ordering_config row 1 → is_ordering_open = true.
 * Run: npx tsx scripts/set-ordering-open.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { Client } from "pg";

async function main() {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("No database URL found in .env.local");

  const client = new Client({ connectionString: url });
  await client.connect();

  const before = await client.query(
    `SELECT is_ordering_open FROM ordering_config WHERE id = 1`,
  );
  console.log("Before:", before.rows[0]);

  await client.query(
    `UPDATE ordering_config SET is_ordering_open = true, updated_at = now() WHERE id = 1`,
  );

  const after = await client.query(
    `SELECT is_ordering_open FROM ordering_config WHERE id = 1`,
  );
  console.log("After:", after.rows[0]);

  await client.end();

  if (!after.rows[0]?.is_ordering_open) {
    console.error("ERROR: value did not update");
    process.exit(1);
  }

  console.log("Done — ordering is now OPEN");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
