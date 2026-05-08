"use client";

import { useMemo, useState } from "react";
import { Download, ShoppingBag } from "lucide-react";

import type { AdminOrder } from "@/lib/admin/orders";
import { serializeOrdersCsv } from "@/lib/admin/csv";

import { OrderRow } from "./OrderRow";

export function OrdersTable({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("");
  const [expanded, setExpanded] = useState<Map<string, boolean>>(new Map());

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (weekFilter && o.week_of !== weekFilter) return false;
      return true;
    });
  }, [initialOrders, statusFilter, weekFilter]);

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Map(prev);
      next.set(id, !prev.get(id));
      return next;
    });
  }

  function exportCsv() {
    const csv = serializeOrdersCsv(
      filteredOrders.map((o) => ({
        reference: o.reference,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        customer_email: o.customer_email,
        delivery_address: o.delivery_address,
        week_of: o.week_of,
        items: o.items.map((i) => ({ product_name: i.product_name, quantity: i.quantity })),
        total_ngn: o.total_ngn,
      })),
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Filters + Export */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="status-filter"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            Status
          </label>
          <select
            id="status-filter"
            aria-label="Status"
            className="h-10 w-44 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            style={{ fontFamily: "var(--font-inter)" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="week-filter"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            Delivery week
          </label>
          <input
            id="week-filter"
            type="date"
            className="h-10 w-44 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            style={{ fontFamily: "var(--font-inter)" }}
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
          />
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <ShoppingBag className="h-8 w-8 text-stone-300" />
            <p
              className="text-sm font-bold text-stone-400"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              No orders found
            </p>
            <p
              className="text-xs text-stone-300"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                {["Reference", "Customer", "Phone", "Date", "Status", "Total (NGN)", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-stone-400 last:text-right"
                      style={{ fontFamily: "var(--font-lexend)" }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredOrders.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  expanded={!!expanded.get(o.id)}
                  onToggle={() => toggleRow(o.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
