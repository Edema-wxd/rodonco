"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  initialNextDeliveryDate: string | null;
  initialCutoffMessage: string | null;
}

export function DeliveryConfigForm({ initialNextDeliveryDate, initialCutoffMessage }: Props) {
  const router = useRouter();
  const [nextDeliveryDate, setNextDeliveryDate] = React.useState(initialNextDeliveryDate ?? "");
  const [cutoffMessage, setCutoffMessage] = React.useState(initialCutoffMessage ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSave() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          next_delivery_date: nextDeliveryDate || null,
          cutoff_message: cutoffMessage || null,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to save delivery settings.");
        return;
      }
      toast.success("Delivery settings saved.");
      router.refresh();
    } catch {
      toast.error("Failed to save delivery settings.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60">
      <p
        className="text-xs font-black uppercase tracking-wider text-stone-400"
        style={{ fontFamily: "var(--font-lexend)" }}
      >
        Delivery Configuration
      </p>
      <h2
        className="mt-1 text-lg font-black text-zinc-800"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Customer-facing delivery date &amp; message
      </h2>
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="next-delivery-date"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            Next delivery date
          </label>
          <input
            id="next-delivery-date"
            type="date"
            value={nextDeliveryDate}
            onChange={(e) => setNextDeliveryDate(e.target.value)}
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cutoff-message"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            Cutoff message (shown to customers when ordering is closed)
          </label>
          <input
            id="cutoff-message"
            type="text"
            value={cutoffMessage}
            onChange={(e) => setCutoffMessage(e.target.value)}
            maxLength={300}
            placeholder="e.g. Ordering reopens Monday at 9 AM"
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </div>
      </div>
      <div className="mt-6">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={submitting}
          className="rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          {submitting ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
