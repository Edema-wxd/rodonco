/**
 * push-schema.ts
 *
 * Custom schema push script using drizzle-kit's programmatic pushSchema API.
 * Uses @neondatabase/serverless with ws WebSocket polyfill so it works from
 * local Node (TCP port 5432 may be firewalled; WS on 443 works fine).
 *
 * Usage: npx tsx scripts/push-schema.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import ws from "ws";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { pushSchema } from "drizzle-kit/api";
import * as schema from "../drizzle/schema";

neonConfig.webSocketConstructor = ws;

async function main() {
  const url = process.env.DIRECT_DATABASE_URL;
  if (!url) throw new Error("DIRECT_DATABASE_URL is not set in .env.local");

  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool });

  console.log("Pushing schema to Neon via WebSocket...");
  const result = await pushSchema(schema, db as any);

  if (result.hasDataLoss) {
    console.warn("Warning: data loss detected in schema push.");
  }

  const stmts = result.statementsToExecute ?? [];
  if (stmts.length === 0) {
    console.log("No changes detected — schema is already up to date.");
  } else {
    console.log(`Applying ${stmts.length} statement(s):`);
    for (const s of stmts) {
      console.log(" ", s);
    }
    await result.apply();
    console.log("Schema pushed successfully.");
  }

  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error("Schema push failed:", e.message || e);
  process.exit(1);
});
