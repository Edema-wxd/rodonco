import { NextResponse } from "next/server";

import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { getProductDetailsById } from "@/lib/shop/productDetails";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [ordering, details] = await Promise.all([getOrderingConfig(), getProductDetailsById(id)]);

  if (!details) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ordering,
      ...details,
    },
    { status: 200 }
  );
}

