"use server";

import { auth } from "@/auth";
import { logActivity, type ActivityAction } from "@/lib/admin/activityLog";

export async function logAuthEventAction(
  action: Extract<ActivityAction, "auth.login" | "auth.logout">,
  emailOverride?: string,
) {
  const adminEmail = emailOverride ?? (await auth())?.user?.email ?? "unknown";
  await logActivity({ adminEmail, action });
}
