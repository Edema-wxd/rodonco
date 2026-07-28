"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";

import type { AdminCustomer } from "@/lib/admin/customers";
import { formatNgn } from "@/lib/admin/format";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomersTable({ customers }: { customers: AdminCustomer[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") ?? "");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("search", value);
      else params.delete("search");
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?");
    }, 300);
  }

  return (
    <div className="space-y-6">
      {/* Search */}
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
          className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 sm:w-72"
          style={{ fontFamily: "var(--font-inter)" }}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Users className="h-8 w-8 text-stone-300" />
            <p
              className="text-sm font-bold text-stone-400"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              No customers found
            </p>
            <p
              className="text-xs text-stone-300"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Customers appear here once they place an order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  {[
                    { label: "Customer", mobile: true },
                    { label: "Phone", mobile: false },
                    { label: "Orders", mobile: true },
                    { label: "Lifetime spend", mobile: true },
                    { label: "Last order", mobile: false },
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
                {customers.map((c) => (
                  <tr
                    key={c.email}
                    onClick={() => router.push(`/admin/customers/${encodeURIComponent(c.email)}`)}
                    className="cursor-pointer transition-colors hover:bg-stone-50/60"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/customers/${encodeURIComponent(c.email)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-zinc-800 hover:text-red-600"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {c.name}
                      </Link>
                      <p className="text-xs text-stone-400">{c.email}</p>
                    </td>

                    <td
                      className="hidden px-6 py-4 text-sm text-stone-500 sm:table-cell"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {c.phone}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className="font-bold text-zinc-800"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {c.order_count}
                      </span>
                      {c.paid_count < c.order_count ? (
                        <span className="ml-1 text-xs text-stone-400">
                          ({c.paid_count} paid)
                        </span>
                      ) : null}
                    </td>

                    <td
                      className="px-6 py-4 font-bold tabular-nums text-zinc-800"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {formatNgn(c.total_spent_ngn)}
                    </td>

                    <td
                      className="hidden px-6 py-4 text-sm text-stone-500 sm:table-cell"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {formatDate(c.last_order_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-stone-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p
        className="text-xs text-stone-400"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        {customers.length} customer{customers.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
