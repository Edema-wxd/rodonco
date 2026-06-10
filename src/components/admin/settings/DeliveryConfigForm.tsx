"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialNextDeliveryDate: string | null;
  initialCutoffMessage: string | null;
  initialDeliveryFeeNgn: number;
}

export function DeliveryConfigForm({ initialNextDeliveryDate, initialCutoffMessage, initialDeliveryFeeNgn }: Props) {
  const router = useRouter();
  const [nextDeliveryDate, setNextDeliveryDate] = React.useState(initialNextDeliveryDate ?? "");
  const [cutoffMessage, setCutoffMessage] = React.useState(initialCutoffMessage ?? "");
  const [deliveryFeeNgn, setDeliveryFeeNgn] = React.useState(String(initialDeliveryFeeNgn));
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
          delivery_fee_ngn: Number(deliveryFeeNgn) || 0,
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
    <div className="rounded-tl-[28px] rounded-tr-xl rounded-bl-xl rounded-br-[28px] bg-white p-6 shadow-sm outline outline-1 outline-stone-200/60 flex flex-col">
      <p
        className="text-[10px] font-black uppercase tracking-widest text-stone-400"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Delivery Config
      </p>
      <h2
        className="mt-1.5 text-lg font-black text-zinc-800"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Schedule & messaging
      </h2>

      <div className="mt-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="next-delivery-date"
            className="text-[10px] font-black uppercase tracking-widest text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
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
            className="text-[10px] font-black uppercase tracking-widest text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Closed message
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
          <p className="text-xs text-stone-400" style={{ fontFamily: "var(--font-inter)" }}>
            Shown when ordering is closed.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="delivery-fee"
            className="text-[10px] font-black uppercase tracking-widest text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Flat delivery fee (₦)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-stone-400">
              ₦
            </span>
            <input
              id="delivery-fee"
              type="number"
              min={0}
              step={100}
              value={deliveryFeeNgn}
              onChange={(e) => setDeliveryFeeNgn(e.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-7 pr-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              style={{ fontFamily: "var(--font-inter)" }}
            />
          </div>
          <p className="text-xs text-stone-400" style={{ fontFamily: "var(--font-inter)" }}>
            Used when no zone pricing applies. Set 0 for free.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
