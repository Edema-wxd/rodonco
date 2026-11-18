// POST /api/admin/orders/[id]/recovery-email
// Emails a customer with an unpaid (pending) order a reminder listing what was
// in it, with a link back to checkout. Sent from the Orders page.

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logActivity } from "@/lib/admin/activityLog";
import { getSiteSettings } from "@/lib/admin/config";
import { getRecentRecoveryEmailAt, getRecoveryOrder } from "@/lib/admin/cartRecoveryServer";
import { sendCartRecoveryEmail } from "@/lib/email/sendCartRecoveryEmail";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getRecoveryOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "pending") {
    return NextResponse.json({ error: "This order is no longer unpaid." }, { status: 409 });
  }
  if (order.items.length === 0) {
    return NextResponse.json({ error: "This order has no items to remind them about." }, { status: 409 });
  }

  const lastSentAt = await getRecentRecoveryEmailAt(order.reference);
  if (lastSentAt) {
    return NextResponse.json(
      {
        error: "A reminder was already emailed for this order in the last 24 hours.",
        lastSentAt: lastSentAt.toISOString(),
      },
      { status: 409 },
    );
  }

  const settings = await getSiteSettings().catch(() => null);
  const result = await sendCartRecoveryEmail(order, {
    whatsappNumber: settings?.whatsapp_number ?? null,
    contactEmail: settings?.contact_email ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "The email could not be sent. Please try again." }, { status: 502 });
  }

  logActivity({
    adminEmail: session.user.email ?? "unknown",
    action: "order.recovery_email_sent",
    entityId: order.id,
    entityLabel: `#${order.reference}`,
    details: { reference: order.reference, to: order.customer_email },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
