// src/components/admin/customers/CustomerDetail.tsx
// Read-only per-customer admin view: contact, rolled-up totals, full order history.

import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, AlertTriangle } from "lucide-react";

import type { AdminCustomerDetail } from "@/lib/admin/customers";
import type { AdminOrder } from "@/lib/admin/orders";
import { formatNgn } from "@/lib/admin/format";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-blue-50 text-blue-700",
  paid: "bg-green-100 text-green-800",
  processing: "bg-amber-100 text-amber-800",
  delivered: "bg-stone-100 text-stone-600",
  cancelled: "bg-red-50 text-red-700",
};

function statusClass(status: string): string {
  return STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm outline outline-1 outline-stone-200/60">
      <p
        className="text-xs font-black uppercase tracking-wider text-stone-400"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        {label}
      </p>
      <p
        className="mt-1.5 text-2xl font-black text-zinc-800"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        {value}
      </p>
    </div>
  );
}

function OrderCard({ order }: { order: AdminOrder }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm outline outline-1 outline-stone-200/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/order/${order.reference}`}
            className="font-bold text-red-600 hover:underline"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {order.reference}
          </Link>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(order.status)}`}
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {order.status}
          </span>
        </div>
        <span
          className="font-bold tabular-nums text-zinc-800"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {formatNgn(order.total_ngn)}
        </span>
      </div>

      <p
        className="mt-1 text-xs text-stone-400"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        Placed {formatDate(order.created_at)}
      </p>

      <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between text-sm"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <span className="font-medium text-zinc-800">
              {item.product_name}
              {item.variant_label ? ` (${item.variant_label})` : ""}
              {item.prep_option ? (
                <span className="ml-1 text-stone-400">— {item.prep_option}</span>
              ) : null}
            </span>
            <span className="ml-4 tabular-nums text-stone-500">×{item.quantity}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
        <p
          className="flex items-start gap-1.5 text-xs text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
          {order.delivery_area ? `${order.delivery_area} — ` : ""}
          {order.delivery_address}
        </p>
        {order.allergy_notes ? (
          <p
            className="flex items-start gap-1.5 text-xs text-amber-700"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Allergy notes: {order.allergy_notes}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CustomerDetail({ customer }: { customer: AdminCustomerDetail }) {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-stone-400 transition-colors hover:text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          All customers
        </Link>

        <h1
          className="mt-3 text-3xl font-black leading-[1.05] text-zinc-800 sm:text-4xl"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          {customer.name}
        </h1>

        <div
          className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <a
            href={`mailto:${customer.email}`}
            className="inline-flex items-center gap-1.5 hover:text-zinc-800"
          >
            <Mail className="h-4 w-4 text-stone-400" />
            {customer.email}
          </a>
          <a
            href={`tel:${customer.phone}`}
            className="inline-flex items-center gap-1.5 hover:text-zinc-800"
          >
            <Phone className="h-4 w-4 text-stone-400" />
            {customer.phone}
          </a>
        </div>
      </div>

      {/* Rollup stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Orders" value={String(customer.order_count)} />
        <Stat label="Paid orders" value={String(customer.paid_count)} />
        <Stat label="Lifetime spend" value={formatNgn(customer.total_spent_ngn)} />
        <Stat label="First order" value={formatDate(customer.first_order_at)} />
      </div>

      {/* Order history */}
      <div className="space-y-4">
        <h2
          className="text-xs font-black uppercase tracking-wider text-stone-400"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Order history
        </h2>
        {customer.orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
