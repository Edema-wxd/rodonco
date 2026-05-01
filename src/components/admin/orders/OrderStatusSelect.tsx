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
  const [, startTransition] = useTransition();
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
      onChange={(e) => void handleChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="mt-1 h-9 w-36 rounded-md border bg-white px-2 text-sm text-gray-900"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  );
}

