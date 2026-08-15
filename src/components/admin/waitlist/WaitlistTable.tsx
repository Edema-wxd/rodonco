"use client";

import { useMemo, useState } from "react";
import { Download, Mailbox } from "lucide-react";

import type { WaitlistEntry } from "@/lib/admin/waitlist";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function csvCell(value: string): string {
  // Quote and escape per RFC 4180 so commas/quotes/newlines survive.
  return `"${value.replace(/"/g, '""')}"`;
}

export function WaitlistTable({ initialEntries }: { initialEntries: WaitlistEntry[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return initialEntries;
    return initialEntries.filter((e) =>
      `${e.name} ${e.email} ${e.area}`.toLowerCase().includes(q),
    );
  }, [initialEntries, searchQuery]);

  function exportCsv() {
    const header = ["Name", "Email", "Area", "Joined"];
    const lines = [
      header.join(","),
      ...filtered.map((e) =>
        [e.name, e.email, e.area, new Date(e.created_at).toISOString()].map(csvCell).join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Search + Export */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="wl-search"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Search
          </label>
          <input
            id="wl-search"
            type="search"
            placeholder="Name, email, or area"
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 sm:w-64"
            style={{ fontFamily: "var(--font-inter)" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="sm:ml-auto">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Mailbox className="h-8 w-8 text-stone-300" />
            <p
              className="text-sm font-bold text-stone-400"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              {initialEntries.length === 0 ? "No signups yet" : "No matches"}
            </p>
            <p className="text-xs text-stone-300" style={{ fontFamily: "var(--font-inter)" }}>
              {initialEntries.length === 0
                ? "Signups from the /waitlist page will appear here."
                : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  {[
                    { label: "Joined", mobile: true },
                    { label: "Name", mobile: true },
                    { label: "Email", mobile: true },
                    { label: "Area", mobile: true },
                  ].map(({ label }) => (
                    <th
                      key={label}
                      className="px-4 py-4 text-left text-xs font-black uppercase tracking-wider text-stone-400"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-stone-50/60">
                    <td
                      className="px-4 py-4 text-xs text-stone-500 whitespace-nowrap"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {formatDate(entry.created_at)}
                    </td>
                    <td
                      className="px-4 py-4 font-bold text-zinc-800"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {entry.name}
                    </td>
                    <td
                      className="px-4 py-4 text-sm text-zinc-700"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      <a
                        href={`mailto:${entry.email}`}
                        className="underline-offset-2 hover:text-red-600 hover:underline"
                      >
                        {entry.email}
                      </a>
                    </td>
                    <td
                      className="px-4 py-4 text-sm text-zinc-700"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {entry.area}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-stone-400" style={{ fontFamily: "var(--font-inter)" }}>
        Showing {filtered.length} of {initialEntries.length} signup{initialEntries.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
