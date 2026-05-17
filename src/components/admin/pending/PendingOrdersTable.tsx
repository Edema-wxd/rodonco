"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { AdminOrder } from "@/lib/admin/orders";

export function PendingOrdersTable({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this abandoned checkout? This cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete order.");
        return;
      }
      toast.success("Order deleted.");
      router.refresh();
    } catch {
      toast.error("Failed to delete order.");
    } finally {
      setDeleting(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-12 text-center shadow-sm outline outline-1 outline-stone-200/60">
        <p
          className="text-sm font-bold text-stone-400"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          No pending orders
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100">
            {[
              { label: "Reference", mobile: true },
              { label: "Customer", mobile: true },
              { label: "Phone", mobile: false },
              { label: "Date", mobile: false },
              { label: "", mobile: true },
            ].map(({ label, mobile }) => (
              <th
                key={label}
                className={`px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-stone-400 last:text-right${mobile ? "" : " hidden sm:table-cell"}`}
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-stone-50/50">
              <td
                className="px-6 py-3 font-mono text-xs text-stone-500"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {order.reference}
              </td>
              <td
                className="px-6 py-3 font-medium text-zinc-800"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {order.customer_name || "—"}
              </td>
              <td
                className="hidden px-6 py-3 text-stone-500 sm:table-cell"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {order.customer_phone || "—"}
              </td>
              <td
                className="hidden px-6 py-3 text-stone-500 sm:table-cell"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {new Date(order.created_at).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-6 py-3 text-right">
                <button
                  type="button"
                  aria-label={`Delete order ${order.reference}`}
                  disabled={deleting === order.id}
                  onClick={() => void handleDelete(order.id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting === order.id ? "Deleting…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
