import "dotenv/config";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import { site_settings } from "../drizzle/schema";

dotenv.config({ path: ".env.local" });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL must be set in .env.local");

  const sql = neon(databaseUrl);
  const db = drizzle({ client: sql });

  await db
    .insert(site_settings)
    .values({
      id: 1,
      whatsapp_number: "+2348086451542",
      contact_email: null,
      instagram_handle: null,
    })
    .onConflictDoUpdate({
      target: site_settings.id,
      set: { whatsapp_number: "+2348086451542" },
    });

  console.log("site_settings seeded — WhatsApp: +2348086451542");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
