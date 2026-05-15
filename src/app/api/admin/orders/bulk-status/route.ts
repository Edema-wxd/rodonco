import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { bulkStatusTransitionSchema } from "@/lib/admin/schemas";
import { bulkTransitionOrders } from "@/lib/admin/bulkTransition";

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
  const updated = await bulkTransitionOrders(week_of, from_status, to_status);

  return NextResponse.json({ updated });
}
