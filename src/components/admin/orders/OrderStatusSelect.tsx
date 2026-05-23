"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STATUS_OPTIONS = ["paid", "processing", "delivered"] as const;

export function OrderStatusSelect({
  orderId,
  initial,
}: {
  orderId: string;
  initial: string;
}) {
  const [value, setValue] = useState<string>(initial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleChange(next: string) {
    const previous = value;
    setValue(next);

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!res.ok) {
      setValue(previous);
      toast.error("Failed to update status. Please try again.");
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <select
      aria-label="Update order status"
      value={value}
      disabled={isPending}
      onChange={(e) => void handleChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="mt-1 h-8 w-36 rounded-lg border border-stone-200 bg-white px-2 text-xs font-medium text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  );
}
