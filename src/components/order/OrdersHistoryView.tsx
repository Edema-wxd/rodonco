// src/components/order/OrdersHistoryView.tsx
// Read-only order history for the "My Orders" magic-link page.
// No PATCH/edit affordances anywhere — customers can view status only.

import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  paid: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  processing: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  delivered: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
};

function statusStyle(status: string) {
  return STATUS_STYLES[status] ?? { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
}

function formatNGN(ngn: number): string {
  return `₦${ngn.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const st = statusStyle(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize",
        st.bg,
        st.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <PackageSearch className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="font-heading text-2xl">No orders yet</h1>
      <p className="mt-3 text-muted-foreground">
        We couldn&apos;t find any orders for this email address.
      </p>
      <div className="mt-8">
        <Link href="/shop" className={cn(buttonVariants({ variant: "default" }))}>
          Start Shopping
        </Link>
      </div>
    </div>
  );
}

export function OrdersHistoryView({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 pb-16">
      <div className="mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl">My Orders</h1>
        <p className="mt-1 text-muted-foreground">
          {orders.length} order{orders.length === 1 ? "" : "s"} on record.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="shadow-sm">
            <CardContent className="pt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge
                  variant="outline"
                  className="font-mono text-xs"
                  style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
                >
                  {order.reference}
                </Badge>
                <StatusBadge status={order.status} />
              </div>

              <Separator />

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  Placed {formatDate(order.created_at)}
                </span>
                <span className="font-heading text-lg" style={{ color: "var(--accent)" }}>
                  {formatNGN(order.total_ngn)}
                </span>
              </div>

              <Link
                href={`/order/${order.reference}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full sm:w-auto")}
              >
                View details
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
