"use client";

import { useMemo } from "react";

import type { AdminProduct } from "@/lib/admin/products";

export function ProductsList({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const rows = useMemo(() => initialProducts, [initialProducts]);

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-semibold text-gray-900">All products</div>
        <button
          type="button"
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          + New Product
        </button>
      </div>

      <table className="w-full text-left">
        <thead className="text-xs font-semibold text-gray-600">
          <tr className="border-b">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Active</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-10 text-center text-gray-500">
                No products yet
              </td>
            </tr>
          ) : (
            rows.map((p) => (
              <tr key={p.id} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.type}</td>
                <td className="px-4 py-3 text-gray-600">{p.is_active ? "Yes" : "No"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

