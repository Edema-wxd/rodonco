"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  currentWeek: string;
}

export function BulkTransitionPanel({ currentWeek }: Props) {
  const router = useRouter();
  const [weekOf, setWeekOf] = useState(currentWeek);
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function transition(fromStatus: "paid" | "processing", toStatus: "processing" | "delivered") {
    const label = fromStatus === "paid" ? "Paid → Processing" : "Processing → Delivered";
    const confirmed = window.confirm(
      `Bulk transition all ${fromStatus} orders for week ${weekOf} to ${toStatus}?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setSubmitting(fromStatus);
    try {
      const res = await fetch("/api/admin/orders/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_of: weekOf, from_status: fromStatus, to_status: toStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error ?? "Failed to update orders.");
        return;
      }

      const data = await res.json() as { updated: number };
      toast.success(`${data.updated} order${data.updated === 1 ? "" : "s"} updated (${label}).`);
      router.refresh();
    } catch {
      toast.error("Failed to update orders.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="mt-8 rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60">
      <p
        className="text-xs font-black uppercase tracking-wider text-stone-400"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Bulk Status Transition
      </p>
      <h2
        className="mt-1 text-lg font-black text-zinc-800"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Move all orders for a week
      </h2>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="bulk-week"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Week of
          </label>
          <input
            id="bulk-week"
            type="date"
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
            className="h-10 w-44 rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </div>

        <div className="flex items-end gap-3">
          <button
            type="button"
            disabled={submitting !== null || !weekOf}
            onClick={() => void transition("paid", "processing")}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {submitting === "paid" && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting === "paid" ? "Updating…" : "Paid → Processing"}
          </button>
          <button
            type="button"
            disabled={submitting !== null || !weekOf}
            onClick={() => void transition("processing", "delivered")}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {submitting === "processing" && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting === "processing" ? "Updating…" : "Processing → Delivered"}
          </button>
        </div>
      </div>

      <p
        className="mt-4 text-xs text-stone-400"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        This updates ALL orders in the selected status for the chosen week.
      </p>
    </div>
  );
}
