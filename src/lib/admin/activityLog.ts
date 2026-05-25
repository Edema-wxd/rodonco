import "server-only";

import { desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { activity_logs } from "../../../drizzle/schema";

export type ActivityAction =
  | "auth.login"
  | "auth.logout"
  | "order.status_changed"
  | "order.deleted"
  | "order.bulk_status_changed"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "settings.ordering_config_updated"
  | "settings.site_settings_updated"
  | "abandoned_cart.marked_contacted"
  | "abandoned_cart.marked_not_contacted"
  | "abandoned_cart.deleted"
  | "abandoned_cart.bulk_marked_contacted"
  | "abandoned_cart.bulk_deleted";

export interface LogActivityInput {
  adminEmail: string;
  action: ActivityAction;
  entityId?: string;
  entityLabel?: string;
  details?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  await db.insert(activity_logs).values({
    admin_email: input.adminEmail,
    action: input.action,
    entity_id: input.entityId ?? null,
    entity_label: input.entityLabel ?? null,
    details: input.details ?? null,
  });
}

export type ActivityLogEntry = {
  id: string;
  admin_email: string;
  action: string;
  entity_id: string | null;
  entity_label: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export async function getActivityLogs(limit = 100): Promise<ActivityLogEntry[]> {
  const rows = await db
    .select()
    .from(activity_logs)
    .orderBy(desc(activity_logs.created_at))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    admin_email: r.admin_email,
    action: r.action,
    entity_id: r.entity_id ?? null,
    entity_label: r.entity_label ?? null,
    details: (r.details as Record<string, unknown> | null) ?? null,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }));
}
