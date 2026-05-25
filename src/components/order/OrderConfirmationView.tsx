// src/components/order/OrderConfirmationView.tsx
// Presentation-only component for /order/[ref].
// Renders either the confirmed order card or the error state (CONTEXT D-09, D-10).
// No client-side interactivity — pure Server Component.

import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { Order, OrderItem } from "@/types";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/email/emailConfig";

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Formats a date string (YYYY-MM-DD or ISO) to "Saturday, 10 May 2025".
 * Used for the next delivery date callout.
 */
function formatDeliveryDate(dateStr: string | null): string {
  if (!dateStr) return "This Saturday";
  // date string is YYYY-MM-DD — parse as UTC midnight to avoid timezone shift
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Formats a kobo integer as NGN currency string: "₦1,500"
 */
function formatNGN(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// ── Error states ──────────────────────────────────────────────────────────────

type ErrorVariant = "not-found" | "not-paid";

interface ErrorStateProps {
  variant: ErrorVariant;
  contactEmail: string;
}

function ErrorState({ variant, contactEmail }: ErrorStateProps) {
  const heading =
    variant === "not-found" ? "Order not found" : "Payment not confirmed";
  const body =
    variant === "not-found"
      ? "We couldn't find this order. If you completed payment, please contact us."
      : "Your payment is still being processed. Check your email or contact us if this persists.";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <AlertCircle
        className="mx-auto mb-4 h-12 w-12"
        style={{ color: "var(--destructive)" }}
        aria-hidden="true"
      />
      <h1 className="font-heading text-2xl">{heading}</h1>
      <p className="mt-3 text-muted-foreground">{body}</p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/shop" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Shop
        </Link>
        <a
          href={`mailto:${contactEmail}`}
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}

// ── Confirmed order card ──────────────────────────────────────────────────────

interface ConfirmedOrderProps {
  order: Order;
  items: OrderItem[];
  nextDeliveryDate: string | null;
}

function ConfirmedOrder({ order, items, nextDeliveryDate }: ConfirmedOrderProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Success header */}
      <div className="mb-8 flex items-center gap-3">
        <CheckCircle
          className="h-8 w-8 shrink-0"
          style={{ color: "var(--accent)" }}
          aria-hidden="true"
        />
        <h1 className="font-heading text-2xl">Order Confirmed</h1>
      </div>

      {/* Customer greeting */}
      <p className="mb-6 text-muted-foreground">
        Thank you,{" "}
        <span className="font-semibold text-foreground">
          {order.customer_name}
        </span>
        . Your order is confirmed and will be delivered on the date below.
      </p>

      <Card>
        <CardHeader className="pb-4">
          {/* Order reference */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Order Reference</span>
            <Badge
              variant="outline"
              className="font-mono text-xs"
              style={{
                color: "var(--accent)",
                borderColor: "var(--accent)",
              }}
            >
              {order.reference}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Delivery details */}
          <div className="rounded-md border p-4 space-y-1">
            <p className="text-sm font-semibold">Delivering to</p>
            <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
            <p
              className="text-sm font-semibold mt-2"
              style={{ color: "var(--accent)" }}
            >
              {formatDeliveryDate(nextDeliveryDate)}
            </p>
          </div>

          {/* Line items */}
          <div>
            <h2 className="mb-3 text-base font-semibold">Your Order</h2>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-sm">
                        {item.product_name}
                        {item.variant_label ? ` · ${item.variant_label}` : ""}
                        {" · "}
                        <span className="text-muted-foreground">
                          qty {item.quantity}
                        </span>
                      </span>
                      {item.prep_option && (
                        <p className="text-xs text-muted-foreground">
                          {item.prep_option}
                        </p>
                      )}
                    </div>
                    <span
                      className="shrink-0 text-sm font-semibold"
                      style={{ color: "var(--accent)" }}
                    >
                      {formatNGN(item.subtotal_ngn)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Divider + total */}
            <div className="mt-4 border-t pt-4 flex justify-between items-center">
              <span className="text-base font-semibold">Total</span>
              <span className="font-heading text-2xl">
                {formatNGN(order.total_ngn)}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-2">
            <Link
              href="/shop"
              className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
            >
              Continue Shopping →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export type OrderConfirmationErrorVariant = ErrorVariant;

interface OrderConfirmationViewProps {
  /** Null means reference not found or status is not paid */
  data: { order: Order; items: OrderItem[] } | null;
  /** Which error to display when data is null */
  errorVariant?: OrderConfirmationErrorVariant;
  /** `ordering_config.next_delivery_date` — passed from server page */
  nextDeliveryDate: string | null;
  /** Contact email from site_settings; falls back to DEFAULT_CONTACT_EMAIL */
  contactEmail?: string;
}

export function OrderConfirmationView({
  data,
  errorVariant = "not-found",
  nextDeliveryDate,
  contactEmail = DEFAULT_CONTACT_EMAIL,
}: OrderConfirmationViewProps) {
  if (!data) {
    return <ErrorState variant={errorVariant} contactEmail={contactEmail} />;
  }

  return (
    <ConfirmedOrder
      order={data.order}
      items={data.items}
      nextDeliveryDate={nextDeliveryDate}
    />
  );
}
