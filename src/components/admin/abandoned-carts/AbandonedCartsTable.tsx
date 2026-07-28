"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Loader2, ShoppingCart, CheckCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { AbandonedCart, AbandonedCartItem } from "@/lib/admin/abandonedCarts";
import { serializeAbandonedCartsCsv } from "@/lib/admin/csv";
import { loadMoreAbandonedCartsAction } from "@/app/admin/abandoned-carts/_actions";
import { ABANDONED_CARTS_PAGE_SIZE } from "@/app/admin/abandoned-carts/_constants";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNgn(naira: number): string {
  return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function itemsSummary(items: AbandonedCartItem[], subtotal: number): string {
  const total = items.reduce((s, i) => s + i.quantity, 0);
  return `${total} item${total !== 1 ? "s" : ""}, ${formatNgn(subtotal)}`;
}

function inDateRange(iso: string, range: string): boolean {
  if (range === "all") return true;
  const days = range === "7d" ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(iso) >= cutoff;
}

// ── Delete confirm dialog ─────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <p
          className="text-sm font-bold text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          {message}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-zinc-700 transition-colors hover:bg-stone-50"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AbandonedCartsTable({
  initialCarts,
}: {
  initialCarts: AbandonedCart[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, startLoadMore] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [contactedFilter, setContactedFilter] = useState<"all" | "contacted" | "not_contacted">("all");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm dialog
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; label: string } | null>(null);

  // Pagination + optimistic local state
  const [localCarts, setLocalCarts] = useState<AbandonedCart[]>(initialCarts);
  const [hasMore, setHasMore] = useState<boolean>(initialCarts.length >= ABANDONED_CARTS_PAGE_SIZE);

  function loadMore() {
    const last = localCarts[localCarts.length - 1];
    if (!last) return;
    startLoadMore(async () => {
      try {
        const next = await loadMoreAbandonedCartsAction({
          created_at: last.created_at,
          id: last.id,
        });
        setLocalCarts((prev) => {
          const seen = new Set(prev.map((c) => c.id));
          const deduped = next.filter((c) => !seen.has(c.id));
          return [...prev, ...deduped];
        });
        setHasMore(next.length >= ABANDONED_CARTS_PAGE_SIZE);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load more carts.");
      }
    });
  }

  const filteredCarts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return localCarts.filter((c) => {
      if (!inDateRange(c.created_at, dateRange)) return false;
      if (contactedFilter === "contacted" && !c.contacted_at) return false;
      if (contactedFilter === "not_contacted" && c.contacted_at) return false;
      if (q) {
        const hay = `${c.customer_name} ${c.customer_phone} ${c.customer_email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [localCarts, searchQuery, contactedFilter, dateRange]);

  // Keep selection in sync with visible rows only
  const visibleIds = useMemo(() => new Set(filteredCarts.map((c) => c.id)), [filteredCarts]);
  const allVisibleSelected =
    filteredCarts.length > 0 && filteredCarts.every((c) => selectedIds.has(c.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of visibleIds) next.add(id);
        return next;
      });
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Per-row actions ─────────────────────────────────────────────────────────

  async function handleContactToggle(cart: AbandonedCart) {
    const action = cart.contacted_at ? "mark_not_contacted" : "mark_contacted";
    const optimisticContactedAt =
      action === "mark_contacted" ? new Date().toISOString() : null;

    setLocalCarts((prev) =>
      prev.map((c) =>
        c.id === cart.id ? { ...c, contacted_at: optimisticContactedAt } : c,
      ),
    );

    const res = await fetch(`/api/admin/abandoned-carts/${cart.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      setLocalCarts((prev) =>
        prev.map((c) =>
          c.id === cart.id ? { ...c, contacted_at: cart.contacted_at } : c,
        ),
      );
      toast.error("Failed to update contact status.");
      return;
    }

    toast.success(
      action === "mark_contacted" ? "Marked as contacted." : "Marked as not contacted.",
    );
    startTransition(() => router.refresh());
  }

  function requestDelete(ids: string[], label: string) {
    setConfirmDelete({ ids, label });
  }

  async function confirmDeleteIds() {
    if (!confirmDelete) return;
    const { ids } = confirmDelete;
    setConfirmDelete(null);

    setLocalCarts((prev) => prev.filter((c) => !ids.includes(c.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });

    const isBulk = ids.length > 1;
    const res = isBulk
      ? await fetch("/api/admin/abandoned-carts/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", ids }),
        })
      : await fetch(`/api/admin/abandoned-carts/${ids[0]}`, { method: "DELETE" });

    if (!res.ok) {
      toast.error("Failed to delete. Please refresh and try again.");
      startTransition(() => router.refresh());
      return;
    }

    toast.success(`${ids.length} record${ids.length !== 1 ? "s" : ""} deleted.`);
    startTransition(() => router.refresh());
  }

  // ── Bulk actions ────────────────────────────────────────────────────────────

  async function handleBulkContactedMark() {
    const ids = [...selectedIds].filter((id) => visibleIds.has(id));
    if (ids.length === 0) return;

    const now = new Date().toISOString();
    setLocalCarts((prev) =>
      prev.map((c) => (ids.includes(c.id) ? { ...c, contacted_at: now } : c)),
    );
    setSelectedIds(new Set());

    const res = await fetch("/api/admin/abandoned-carts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_contacted", ids }),
    });

    if (!res.ok) {
      toast.error("Bulk update failed.");
      startTransition(() => router.refresh());
      return;
    }

    toast.success(`${ids.length} records marked as contacted.`);
    startTransition(() => router.refresh());
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function exportCsv() {
    const csv = serializeAbandonedCartsCsv(
      filteredCarts.map((c) => ({
        customer_name: c.customer_name,
        customer_phone: c.customer_phone,
        customer_email: c.customer_email,
        delivery_address: c.delivery_address,
        items: c.cart_items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
        })),
        subtotal_ngn: c.subtotal_ngn,
        created_at: c.created_at,
        contacted_at: c.contacted_at,
      })),
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `abandoned-carts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const activeSelectionCount = [...selectedIds].filter((id) => visibleIds.has(id)).length;

  return (
    <div className="space-y-6">
      {confirmDelete && (
        <ConfirmDialog
          message={
            confirmDelete.ids.length === 1
              ? `Delete the abandoned cart for "${confirmDelete.label}"? This cannot be undone.`
              : `Delete ${confirmDelete.ids.length} abandoned cart records? This cannot be undone.`
          }
          onConfirm={() => void confirmDeleteIds()}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Filters + Export */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ac-search"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Search
          </label>
          <input
            id="ac-search"
            type="search"
            placeholder="Name, phone, or email"
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 sm:w-56"
            style={{ fontFamily: "var(--font-inter)" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ac-date"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Date range
          </label>
          <select
            id="ac-date"
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 sm:w-44"
            style={{ fontFamily: "var(--font-inter)" }}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Contacted status */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="ac-contacted"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Status
          </label>
          <select
            id="ac-contacted"
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 sm:w-44"
            style={{ fontFamily: "var(--font-inter)" }}
            value={contactedFilter}
            onChange={(e) => setContactedFilter(e.target.value as typeof contactedFilter)}
          >
            <option value="all">All</option>
            <option value="not_contacted">Not contacted</option>
            <option value="contacted">Contacted</option>
          </select>
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

      {/* Bulk action bar */}
      {activeSelectionCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
          <span
            className="text-sm font-bold text-zinc-700"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {activeSelectionCount} selected
          </span>
          <button
            type="button"
            onClick={() => void handleBulkContactedMark()}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            <CheckCheck className="h-3 w-3" />
            Mark contacted
          </button>
          <button
            type="button"
            onClick={() =>
              requestDelete(
                [...selectedIds].filter((id) => visibleIds.has(id)),
                `${activeSelectionCount} records`,
              )
            }
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-stone-400 hover:text-zinc-700"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div>
      <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
        {filteredCarts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <ShoppingCart className="h-8 w-8 text-stone-300" />
            <p
              className="text-sm font-bold text-stone-400"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              No abandoned carts found
            </p>
            <p className="text-xs text-stone-300" style={{ fontFamily: "var(--font-inter)" }}>
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-stone-300 accent-red-600"
                      aria-label="Select all"
                    />
                  </th>
                  {[
                    { label: "Date", mobile: true },
                    { label: "Customer", mobile: true },
                    { label: "Phone", mobile: false },
                    { label: "Cart", mobile: true },
                    { label: "Status", mobile: true },
                    { label: "Actions", mobile: true },
                  ].map(({ label, mobile }) => (
                    <th
                      key={label}
                      className={`px-4 py-4 text-left text-xs font-black uppercase tracking-wider text-stone-400 last:text-right${mobile ? "" : " hidden sm:table-cell"}`}
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredCarts.map((cart) => (
                  <tr
                    key={cart.id}
                    className={`transition-colors ${selectedIds.has(cart.id) ? "bg-red-50" : "hover:bg-stone-50/60"}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(cart.id)}
                        onChange={() => toggleRow(cart.id)}
                        className="h-4 w-4 rounded border-stone-300 accent-red-600"
                        aria-label={`Select ${cart.customer_name}`}
                      />
                    </td>

                    {/* Date */}
                    <td
                      className="px-4 py-4 text-xs text-stone-500 whitespace-nowrap"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {formatDate(cart.created_at)}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <p
                        className="font-bold text-zinc-800"
                        style={{ fontFamily: "var(--font-quicksand)" }}
                      >
                        {cart.customer_name}
                      </p>
                      <p
                        className="text-xs text-stone-500"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {cart.customer_email}
                      </p>
                    </td>

                    {/* Phone */}
                    <td
                      className="hidden px-4 py-4 text-sm text-zinc-700 sm:table-cell"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {cart.customer_phone}
                    </td>

                    {/* Cart summary */}
                    <td
                      className="px-4 py-4 text-sm text-zinc-700"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {itemsSummary(cart.cart_items, cart.subtotal_ngn)}
                    </td>

                    {/* Contacted status */}
                    <td className="px-4 py-4">
                      {cart.contacted_at ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700"
                          style={{ fontFamily: "var(--font-quicksand)" }}
                        >
                          <CheckCheck className="h-3 w-3" />
                          Contacted
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-500"
                          style={{ fontFamily: "var(--font-quicksand)" }}
                        >
                          Not contacted
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleContactToggle(cart)}
                          disabled={isPending}
                          className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
                          style={{ fontFamily: "var(--font-quicksand)" }}
                        >
                          {cart.contacted_at ? "Unmark" : "Mark contacted"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestDelete([cart.id], cart.customer_name)
                          }
                          disabled={isPending}
                          className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                          style={{ fontFamily: "var(--font-quicksand)" }}
                          aria-label={`Delete cart for ${cart.customer_name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
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
            Showing {localCarts.length} cart{localCarts.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
