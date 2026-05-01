"use client";

import { useMemo, useState } from "react";

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
    <div className="rounded-lg border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-semibold text-gray-900">All products</div>
        <button
          type="button"
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          onClick={() => setCreating(true)}
        >
          + New Product
        </button>
      </div>

      <table className="w-full text-left">
        <thead className="text-xs font-semibold text-gray-600">
          <tr className="border-b">
            <th className="px-4 py-3">Image</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Active</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                No products yet
              </td>
            </tr>
          ) : (
            rows.map((p) => (
              <tr
                key={p.id}
                className="cursor-pointer border-b last:border-b-0 hover:bg-gray-50"
                onClick={() => setEditing(p)}
              >
                <td className="px-4 py-3">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-10 w-10 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md border border-dashed bg-gray-50" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.type}</td>
                <td className="px-4 py-3 text-gray-600">{p.is_active ? "Yes" : "No"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <ProductDrawer open={open} product={editing} onClose={close} />
    </div>
  );
}

