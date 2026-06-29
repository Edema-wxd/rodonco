// src/components/order/OrderConfirmationView.tsx
// Presentation component for /order/[ref].
// Renders confirmed order, pending state, or error state (CONTEXT D-09, D-10).
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle,
  AlertCircle,
  Mail,
  Truck,
  Package,
  Phone,
  MapPin,
  CalendarDays,
  MessageSquare,
  ArrowRight,
  Clock,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { Order, OrderItem } from "@/types";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/email/emailConfig";

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatDeliveryDate(dateStr: string | null): string {
  if (!dateStr) return "This Saturday";
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

function formatNGN(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 2) return email;
  return `${local[0]}${"•".repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}

// ── Error states ──────────────────────────────────────────────────────────────

type ErrorVariant = "not-found" | "not-paid" | "pending";

interface ErrorStateProps {
  variant: ErrorVariant;
  contactEmail: string;
  reference?: string;
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 10;

function ErrorState({ variant, contactEmail, reference }: ErrorStateProps) {
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (variant !== "pending" || !reference) return;

    const timer = setInterval(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > POLL_MAX_ATTEMPTS) {
        clearInterval(timer);
        return;
      }
      try {
        const res = await fetch(`/api/orders/status?ref=${encodeURIComponent(reference)}`);
        if (!res.ok) return;
        const { status } = await res.json();
        if (status === "paid") {
          clearInterval(timer);
          window.location.reload();
        }
      } catch {
        // network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [variant, reference]);

  if (variant === "pending") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 ring-4 ring-amber-100">
          <Clock className="h-8 w-8 text-amber-500" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl">Confirming your payment…</h1>
        <p className="mt-3 text-muted-foreground">
          We&apos;re waiting for Paystack to confirm your payment. This usually takes a few seconds.
          This page will refresh automatically.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.location.reload()}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Refresh now
          </button>
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

  const heading =
    variant === "not-found" ? "Order not found" : "Payment not confirmed";
  const body =
    variant === "not-found"
      ? "We couldn't find this order. If you completed payment, please contact us with your payment reference."
      : "Your payment is still being processed. Check your email or contact us if this persists.";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-4 ring-red-100">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
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

// ── Stripped confirmed order (no PII) ────────────────────────────────────────

interface StrippedOrderProps {
  order: Order;
  contactEmail: string;
}

function StrippedOrder({ order, contactEmail }: StrippedOrderProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100">
        <CheckCircle className="h-8 w-8" style={{ color: "var(--accent)" }} aria-hidden="true" />
      </div>
      <h1 className="font-heading text-2xl">Order Confirmed</h1>
      <p className="mt-3 text-muted-foreground">
        Payment received. A confirmation email has been sent to the address provided at checkout.
      </p>

      <div className="mx-auto mt-8 max-w-xs rounded-xl border bg-card p-6 text-left shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Reference</span>
          <Badge
            variant="outline"
            className="font-mono text-xs"
            style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
          >
            {order.reference}
          </Badge>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Total paid</span>
          <span className="font-heading text-xl" style={{ color: "var(--accent)" }}>
            {formatNGN(order.total_ngn * 100)}
          </span>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Questions? Email{" "}
        <a href={`mailto:${contactEmail}`} className="underline underline-offset-2">
          {contactEmail}
        </a>
      </p>

      <div className="mt-6">
        <Link href="/shop" className={cn(buttonVariants({ variant: "outline" }))}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

// ── What happens next steps ───────────────────────────────────────────────────

const NEXT_STEPS = [
  {
    icon: Mail,
    label: "Confirmation email sent",
    description: "Check your inbox — we've sent your order receipt with full details.",
    done: true,
  },
  {
    icon: Package,
    label: "We prepare your order",
    description: "Your fresh produce and kits are sourced and packed with care before delivery day.",
    done: false,
  },
  {
    icon: Truck,
    label: "Delivered to your door",
    description: "We'll deliver on the date shown below. No need to be home — leave delivery instructions if needed.",
    done: false,
  },
];

function WhatsNext() {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">What happens next</h2>
      <ol className="relative space-y-0">
        {NEXT_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === NEXT_STEPS.length - 1;
          return (
            <li key={step.label} className="flex gap-4">
              {/* Timeline track */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2",
                    step.done
                      ? "ring-[var(--accent)] bg-green-50"
                      : "ring-border bg-muted"
                  )}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: step.done ? "var(--accent)" : undefined }}
                    aria-hidden="true"
                  />
                </div>
                {!isLast && (
                  <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: "2rem" }} />
                )}
              </div>

              {/* Content */}
              <div className={cn("pb-6 pt-1 min-w-0", isLast && "pb-0")}>
                <p className="text-sm font-semibold leading-tight">{step.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Confirmed order card ──────────────────────────────────────────────────────

interface ConfirmedOrderProps {
  order: Order;
  items: OrderItem[];
  nextDeliveryDate: string | null;
  contactEmail: string;
}

function ConfirmedOrder({ order, items, nextDeliveryDate, contactEmail }: ConfirmedOrderProps) {
  const deliveryLabel = formatDeliveryDate(nextDeliveryDate);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 pb-16">
      {/* ── Success banner ── */}
      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-4">
        <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100 sm:mb-0">
          <CheckCircle className="h-7 w-7" style={{ color: "var(--accent)" }} aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl">Order Confirmed!</h1>
          <p className="mt-1 text-muted-foreground">
            Thank you,{" "}
            <span className="font-semibold text-foreground">{order.customer_name}</span>.
            {" "}Your payment was received and your order is locked in.
          </p>
        </div>
      </div>

      {/* ── Delivery callout ── */}
      <div
        className="mb-6 flex items-center gap-3 rounded-xl border-2 p-4"
        style={{ borderColor: "var(--accent)", background: "oklch(0.97 0.01 151)" }}
      >
        <CalendarDays className="h-5 w-5 shrink-0" style={{ color: "var(--accent)" }} aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Delivery date
          </p>
          <p className="text-base font-bold" style={{ color: "var(--accent)" }}>
            {deliveryLabel}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Order summary card ── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-base font-semibold">Order Summary</h2>
              <Badge
                variant="outline"
                className="font-mono text-xs"
                style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
              >
                {order.reference}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Line items */}
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {item.product_name}
                      {item.variant_label && (
                        <span className="text-muted-foreground"> · {item.variant_label}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity}
                      {item.prep_option && ` · ${item.prep_option}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatNGN(item.subtotal_ngn * 100)}
                  </span>
                </li>
              ))}
            </ul>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-semibold">Total paid</span>
              <span className="font-heading text-2xl" style={{ color: "var(--accent)" }}>
                {formatNGN(order.total_ngn * 100)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Delivery & contact details ── */}
        <Card className="shadow-sm">
          <CardContent className="pt-5 space-y-4">
            <h2 className="text-base font-semibold">Delivery Details</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{order.delivery_address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Confirmation sent to</p>
                  <p className="text-sm">{maskEmail(order.customer_email)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{order.customer_phone}</p>
                </div>
              </div>

              {order.allergy_notes && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted-foreground">Allergy / prep notes</p>
                    <p className="text-sm">{order.allergy_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── What happens next ── */}
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <WhatsNext />
          </CardContent>
        </Card>

        {/* ── Support footer ── */}
        <div className="rounded-xl border bg-muted/40 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Need to change something?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reach us at{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="underline underline-offset-2 text-foreground"
              >
                {contactEmail}
              </a>{" "}
              as soon as possible — changes can only be made before preparation begins.
            </p>
          </div>
          <a
            href={`mailto:${contactEmail}?subject=Order ${order.reference}`}
            className={cn(buttonVariants({ variant: "outline" }), "shrink-0 text-xs")}
          >
            Email Us
          </a>
        </div>

        {/* ── CTA ── */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className={cn(buttonVariants({ variant: "default" }), "flex-1 sm:flex-none gap-2")}
          >
            Shop Again <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export type OrderConfirmationErrorVariant = ErrorVariant;

interface OrderConfirmationViewProps {
  data: { order: Order; items: OrderItem[] } | null;
  errorVariant?: OrderConfirmationErrorVariant;
  stripped?: boolean;
  nextDeliveryDate: string | null;
  contactEmail?: string;
  reference?: string;
}

export function OrderConfirmationView({
  data,
  errorVariant = "not-found",
  stripped = false,
  nextDeliveryDate,
  contactEmail = DEFAULT_CONTACT_EMAIL,
  reference,
}: OrderConfirmationViewProps) {
  if (!data) {
    return <ErrorState variant={errorVariant} contactEmail={contactEmail} reference={reference} />;
  }

  if (stripped) {
    return <StrippedOrder order={data.order} contactEmail={contactEmail} />;
  }

  return (
    <ConfirmedOrder
      order={data.order}
      items={data.items}
      nextDeliveryDate={nextDeliveryDate}
      contactEmail={contactEmail}
    />
  );
}
