import "server-only";

import { desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { admins } from "../../../drizzle/schema";

export type AdminUser = {
  id: string;
  email: string;
  created_at: string;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const rows = await db
    .select({ id: admins.id, email: admins.email, created_at: admins.created_at })
    .from(admins)
    .orderBy(desc(admins.created_at));

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }));
}
