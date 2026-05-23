"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { PrepListRow } from "@/lib/admin/prepList";

export function PrepListWeekInput({ currentWeek }: { currentWeek: string }) {
  const router = useRouter();
  return (
    <input
      id="prep-week"
      type="date"
      defaultValue={currentWeek}
      onChange={(e) => {
        if (e.target.value) router.push(`/admin/prep-list?week=${e.target.value}`);
      }}
      className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
      style={{ fontFamily: "var(--font-inter)" }}
    />
  );
}

type SortField = "product_name" | "total_quantity";

export function PrepListTable({ rows }: { rows: PrepListRow[] }) {
  const [sortField, setSortField] = useState<SortField>("product_name");
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc((v) => !v);
    } else {
      setSortField(field);
      setSortAsc(field === "product_name"); // name asc, qty desc by default
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const mult = sortAsc ? 1 : -1;
    if (sortField === "total_quantity") {
      return (a.total_quantity - b.total_quantity) * mult;
    }
    return a.product_name.localeCompare(b.product_name) * mult;
  });

  if (rows.length === 0) {
    return (
      <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-12 text-center shadow-sm outline outline-1 outline-stone-200/60">
        <p
          className="text-sm font-bold text-stone-400"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          No items for this week
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100">
            {[
              { key: "product_name" as SortField, label: "Product" },
              { key: null, label: "Variant" },
              { key: null, label: "Prep" },
              { key: "total_quantity" as SortField, label: "Qty" },
            ].map(({ key, label }) => (
              <th
                key={label}
                className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-stone-400"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                {key ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className="flex items-center gap-1 hover:text-zinc-800"
                  >
                    {label}
                    {sortField === key ? (sortAsc ? " ↑" : " ↓") : ""}
                  </button>
                ) : (
                  label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {sorted.map((row, i) => (
            <tr key={i} className="hover:bg-stone-50/50">
              <td
                className="px-6 py-3 font-medium text-zinc-800"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {row.product_name}
              </td>
              <td
                className="px-6 py-3 text-stone-500"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {row.variant_label ?? "—"}
              </td>
              <td
                className="px-6 py-3 text-stone-500"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {row.prep_option ?? "—"}
              </td>
              <td
                className="px-6 py-3 font-black text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                {row.total_quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
