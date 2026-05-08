"use client";

import { useMemo, useState } from "react";
import { Package, Plus } from "lucide-react";

import type { AdminProduct } from "@/lib/admin/products";

import { ProductDrawer } from "./ProductDrawer";

export function ProductsList({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const rows = useMemo(() => initialProducts, [initialProducts]);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [creating, setCreating] = useState(false);

  const open = creating || editing !== null;

  function close() {
    setEditing(null);
    setCreating(false);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <p
          className="text-xs font-black uppercase tracking-wider text-stone-400"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          {rows.length} {rows.length === 1 ? "product" : "products"}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          <Plus className="h-4 w-4" />
          + New Product
        </button>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package className="h-8 w-8 text-stone-300" />
            <p
              className="text-sm font-bold text-stone-400"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              No products yet
            </p>
            <p
              className="text-xs text-stone-300"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Click &ldquo;+ New Product&rdquo; to add your first item.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                {["Image", "Name", "Type", "Active"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-xs font-black uppercase tracking-wider text-stone-400"
                    style={{ fontFamily: "var(--font-lexend)" }}
                  >
                    {h}
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
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-12 w-12 rounded-2xl border border-stone-100 object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl border border-dashed border-stone-200 bg-stone-50" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="font-bold text-zinc-800"
                      style={{ fontFamily: "var(--font-lexend)" }}
                    >
                      {p.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold capitalize text-stone-600"
                      style={{ fontFamily: "var(--font-lexend)" }}
                    >
                      {p.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.is_active ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800"
                        style={{ fontFamily: "var(--font-lexend)" }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Yes
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-500"
                        style={{ fontFamily: "var(--font-lexend)" }}
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

      <ProductDrawer open={open} product={editing} onClose={close} />
    </div>
  );
}
