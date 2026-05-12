"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";

import type { ManifestOrder } from "@/lib/admin/manifest";
import { formatNgn } from "@/lib/admin/format";

type SortBy = "name" | "address";

export function ManifestTable({
  orders,
  currentWeek,
}: {
  orders: ManifestOrder[];
  currentWeek: string;
}) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortBy>("name");

  const sorted = [...orders].sort((a, b) => {
    if (sortBy === "address") {
      return a.delivery_address.localeCompare(b.delivery_address);
    }
    return a.customer_name.localeCompare(b.customer_name);
  });

  return (
    <div className="space-y-4">
      {/* Controls — hidden in print */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <label
          htmlFor="manifest-week"
          className="text-xs font-black uppercase tracking-wider text-stone-400"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Week
        </label>
        <input
          id="manifest-week"
          type="date"
          defaultValue={currentWeek}
          onChange={(e) => {
            if (e.target.value) router.push(`/admin/manifest?week=${e.target.value}`);
          }}
          className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          style={{ fontFamily: "var(--font-inter)" }}
        />

        <button
          type="button"
          onClick={() => setSortBy("name")}
          className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
            sortBy === "name"
              ? "bg-zinc-800 text-white"
              : "bg-white text-stone-500 outline outline-1 outline-stone-200 hover:bg-stone-50"
          }`}
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Sort by Name
        </button>
        <button
          type="button"
          onClick={() => setSortBy("address")}
          className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
            sortBy === "address"
              ? "bg-zinc-800 text-white"
              : "bg-white text-stone-500 outline outline-1 outline-stone-200 hover:bg-stone-50"
          }`}
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Sort by Address
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 print:hidden"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          <Printer className="h-4 w-4" />
          Print Manifest
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-12 text-center shadow-sm outline outline-1 outline-stone-200/60">
          <p
            className="text-sm font-bold text-stone-400"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            No deliveries for this week
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-6 shadow-sm outline outline-1 outline-stone-200/60 print:break-inside-avoid print:shadow-none print:outline-none"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-base font-black text-zinc-800"
                    style={{ fontFamily: "var(--font-quicksand)" }}
                  >
                    {order.customer_name}
                  </p>
                  <p
                    className="mt-0.5 text-sm text-stone-500"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {order.customer_phone}
                  </p>
                  <p
                    className="mt-1 text-sm text-stone-600"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {order.delivery_address}
                  </p>
                  {order.allergy_notes && (
                    <p
                      className="mt-1 text-sm font-medium text-red-600"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {order.allergy_notes}
                    </p>
                  )}
                </div>
                <p
                  className="shrink-0 text-base font-black text-zinc-800"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  {formatNgn(order.total_ngn)}
                </p>
              </div>
              <ul className="mt-4 space-y-1 border-t border-stone-100 pt-4">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between text-sm text-stone-600"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    <span>
                      {item.product_name}
                      {item.variant_label ? ` (${item.variant_label})` : ""}
                      {item.prep_option ? ` — ${item.prep_option}` : ""}
                    </span>
                    <span className="font-bold">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
