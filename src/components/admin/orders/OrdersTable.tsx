"use client";

import { useMemo, useState } from "react";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status-filter"
            aria-label="Status"
            className="h-10 w-44 rounded-md border bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="week-filter" className="text-sm font-medium text-gray-700">
            Delivery week
          </label>
          <input
            id="week-filter"
            type="date"
            className="h-10 w-44 rounded-md border bg-white px-3 text-sm"
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
          />
        </div>

        <div className="ml-auto">
          <button
            type="button"
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            onClick={exportCsv}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-gray-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Total (NGN)</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={7}>
                  <div className="text-sm text-gray-500">No orders found</div>
                  <div className="mt-1 text-sm text-gray-400">Try adjusting your filters.</div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  expanded={!!expanded.get(o.id)}
                  onToggle={() => toggleRow(o.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

