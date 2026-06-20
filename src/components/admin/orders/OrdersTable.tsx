"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import type { AdminOrder, OrderFilters } from "@/lib/admin/orders";
import { serializeOrdersCsv } from "@/lib/admin/csv";
import { loadMoreOrdersAction } from "@/app/admin/orders/_actions";
import { ORDERS_PAGE_SIZE } from "@/app/admin/orders/_constants";

import { OrderRow } from "./OrderRow";

export function OrdersTable({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status") ?? "all";
  const weekFilter = searchParams.get("weekOf") ?? "";
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") ?? "");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [expanded, setExpanded] = useState<Map<string, boolean>>(new Map());
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [hasMore, setHasMore] = useState<boolean>(initialOrders.length >= ORDERS_PAGE_SIZE);
  const [isLoadingMore, startLoadMore] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?");
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      updateParam("search", value);
    }, 300);
  }

  function loadMore() {
    const last = orders[orders.length - 1];
    if (!last) return;
    const filters: OrderFilters = {
      status: statusFilter !== "all" ? statusFilter : undefined,
      weekOf: weekFilter || undefined,
      search: searchQuery.trim() || undefined,
    };
    startLoadMore(async () => {
      try {
        const next = await loadMoreOrdersAction(
          { created_at: last.created_at, id: last.id },
          filters,
        );
        setOrders((prev) => {
          const seen = new Set(prev.map((o) => o.id));
          const deduped = next.filter((o) => !seen.has(o.id));
          return [...prev, ...deduped];
        });
        setHasMore(next.length >= ORDERS_PAGE_SIZE);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load more orders.");
      }
    });
  }

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Map(prev);
      next.set(id, !prev.get(id));
      return next;
    });
  }

  function exportCsv() {
    const csv = serializeOrdersCsv(
      orders.map((o) => ({
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
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="customer-search"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Search
          </label>
          <input
            id="customer-search"
            type="search"
            placeholder="Name, phone, or email"
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 sm:w-56"
            style={{ fontFamily: "var(--font-inter)" }}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="status-filter"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Status
          </label>
          <select
            id="status-filter"
            aria-label="Status"
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 sm:w-44"
            style={{ fontFamily: "var(--font-inter)" }}
            value={statusFilter}
            onChange={(e) => updateParam("status", e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="week-filter"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Delivery week
          </label>
          <input
            id="week-filter"
            type="date"
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 sm:w-44"
            style={{ fontFamily: "var(--font-inter)" }}
            value={weekFilter}
            onChange={(e) => updateParam("weekOf", e.target.value)}
          />
        </div>

        <div className="sm:ml-auto">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div>
      <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <ShoppingBag className="h-8 w-8 text-stone-300" />
            <p
              className="text-sm font-bold text-stone-400"
              style={{ fontFamily: "var(--font-quicksand)" }}
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
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                {[
                  { label: "Reference", mobile: true },
                  { label: "Customer", mobile: true },
                  { label: "Phone", mobile: false },
                  { label: "Date", mobile: false },
                  { label: "Status", mobile: true },
                  { label: "Total (NGN)", mobile: true },
                  { label: "", mobile: true },
                ].map(({ label, mobile }) => (
                    <th
                      key={label}
                      className={`px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-stone-400 last:text-right${mobile ? "" : " hidden sm:table-cell"}`}
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {orders.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  expanded={!!expanded.get(o.id)}
                  onToggle={() => toggleRow(o.id)}
                />
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-2.5 text-sm font-bold text-zinc-800 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              <>Load more</>
            )}
          </button>
          <p
            className="text-xs text-stone-400"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Showing {orders.length} order{orders.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
