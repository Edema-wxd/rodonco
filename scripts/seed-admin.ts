import "dotenv/config";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

import { admins } from "../drizzle/schema";

dotenv.config({ path: ".env.local" });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set");
  }

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  const sql = neon(databaseUrl);
  const db = drizzle({ client: sql });

  const password_hash = await bcrypt.hash(password, 12);

  await db
    .insert(admins)
    .values({ email, password_hash })
    .onConflictDoNothing();

  console.log("Admin seeded:", email);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
