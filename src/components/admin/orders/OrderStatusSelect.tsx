"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const STATUS_OPTIONS = ["pending", "paid", "processing", "delivered", "cancelled"] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  paid: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  processing: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  delivered: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
};

function pillStyle(s: string) {
  return STATUS_STYLES[s] ?? { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
}

export function OrderStatusSelect({
  orderId,
  initial,
}: {
  orderId: string;
  initial: string;
}) {
  const [value, setValue] = useState<string>(initial);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  async function handleSelect(next: string) {
    setOpen(false);
    if (next === value) return;
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

  const st = pillStyle(value);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Update order status"
        disabled={isPending}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${st.bg} ${st.text}`}
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
        )}
        {value}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Order status options"
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[9rem] overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {STATUS_OPTIONS.map((s) => {
            const opt = pillStyle(s);
            return (
              <li key={s}>
                <button
                  type="button"
                  role="option"
                  aria-selected={s === value}
                  onClick={() => void handleSelect(s)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold capitalize transition-colors hover:bg-stone-50 ${s === value ? "opacity-50 cursor-default" : ""}`}
                  style={{ fontFamily: "var(--font-quicksand)" }}
                >
                  <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                  <span className={opt.text}>{s}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
