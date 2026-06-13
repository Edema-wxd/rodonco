"use client";

import { useMemo, useState } from "react";
import { Package, Plus, Search, ChevronUp, ChevronDown } from "lucide-react";

import type { AdminProduct } from "@/lib/admin/products";

import { ProductDrawer } from "./ProductDrawer";

export function ProductsList({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? initialProducts.filter((p) => p.name.toLowerCase().includes(q))
      : initialProducts;
    return [...filtered].sort((a, b) =>
      sortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  }, [initialProducts, search, sortDir]);

  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    for (const p of initialProducts) {
      if (p.category) set.add(p.category);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [initialProducts]);

  const open = creating || editing !== null;

  function close() {
    setEditing(null);
    setCreating(false);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-800 placeholder:text-stone-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <p
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {rows.length} {rows.length === 1 ? "product" : "products"}
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            <Plus className="h-4 w-4" />
            + New Product
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-x-auto overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package className="h-8 w-8 text-stone-300" />
            <p
              className="text-sm font-bold text-stone-400"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              {search.trim() ? `No products matching "${search.trim()}"` : "No products yet"}
            </p>
            {!search.trim() && (
              <p
                className="text-xs text-stone-300"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Click &ldquo;+ New Product&rdquo; to add your first item.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                {(["Image", "Name", "Type", "Active"] as const).map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-400"
                    style={{ fontFamily: "var(--font-quicksand)" }}
                  >
                    {h === "Name" ? (
                      <button
                        type="button"
                        onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                        className="inline-flex items-center gap-1 transition-colors hover:text-zinc-700"
                      >
                        Name
                        {sortDir === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    ) : (
                      h
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer transition-colors hover:bg-stone-50/60"
                  onClick={() => setEditing(p)}
                >
                  <td className="px-6 py-4">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0].url}
                        alt=""
                        loading="lazy"
                        className="h-12 w-12 rounded-2xl border border-stone-100 object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl border border-dashed border-stone-200 bg-stone-50" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="font-bold text-zinc-800"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {p.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold capitalize text-stone-600"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {p.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.is_active ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800"
                        style={{ fontFamily: "var(--font-quicksand)" }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Yes
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-500"
                        style={{ fontFamily: "var(--font-quicksand)" }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductDrawer
        open={open}
        product={editing}
        existingCategories={existingCategories}
        onClose={close}
      />
    </div>
  );
}
