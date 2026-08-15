// src/lib/admin/waitlist.ts
// Server-only helper: load waitlist signups for the admin view.

import "server-only";

import { desc } from "drizzle-orm";

import { db, schema } from "@/lib/db";

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  area: string;
  created_at: string; // ISO
}

// Most-recent first. Capped to keep the admin page responsive; raise or add
// keyset pagination if the list outgrows this.
const MAX_ROWS = 1000;

export async function getWaitlistSignups(limit = MAX_ROWS): Promise<WaitlistEntry[]> {
  const rows = await db
    .select()
    .from(schema.waitlist)
    .orderBy(desc(schema.waitlist.created_at))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    area: row.area,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  }));
}
