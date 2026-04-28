import { config } from "dotenv";
config({ path: ".env.local" });
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  // drizzle-kit push uses the standard 'pg' driver (not @neondatabase/serverless)
  // because the serverless driver requires a WebSocket polyfill in local Node.
  // DIRECT_DATABASE_URL (non-pooled) is required for DDL — pooled PgBouncer
  // rejects multi-statement DDL (RESEARCH.md Pitfall 1).
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL!,
  },
});
