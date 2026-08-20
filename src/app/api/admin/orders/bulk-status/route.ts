import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { bulkStatusTransitionSchema } from "@/lib/admin/schemas";
import { bulkTransitionOrders } from "@/lib/admin/bulkTransition";
import { logActivity } from "@/lib/admin/activityLog";
import {
  sendOrderStatusEmails,
  shouldNotifyStatusChange,
} from "@/lib/email/sendOrderStatusEmails";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bulkStatusTransitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { week_of, from_status, to_status } = parsed.data;
  const { count: updated, orders } = await bulkTransitionOrders(week_of, from_status, to_status);

  logActivity({
    adminEmail: session.user.email ?? "unknown",
    action: "order.bulk_status_changed",
    details: { from: from_status, to: to_status, count: updated, week_of },
  }).catch(() => {});

  // Fire-and-forget: only the rows this call actually transitioned are emailed,
  // so re-running the same transition notifies nobody a second time.
  if (orders.length > 0 && shouldNotifyStatusChange(from_status, to_status)) {
    void sendOrderStatusEmails(orders, to_status);
  }

  return NextResponse.json({ updated });
}
