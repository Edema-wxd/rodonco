"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { DeliveryZone } from "@/lib/admin/config";

interface Props {
  initialZones: DeliveryZone[];
}

export function DeliveryZonesForm({ initialZones }: Props) {
  const router = useRouter();
  const [zones, setZones] = React.useState<DeliveryZone[]>(initialZones);
  const [submitting, setSubmitting] = React.useState(false);

  function addZone() {
    setZones((prev) => [...prev, { area: "", fee_ngn: 0 }]);
  }

  function removeZone(index: number) {
    setZones((prev) => prev.filter((_, i) => i !== index));
  }

  function updateZone(index: number, field: keyof DeliveryZone, value: string) {
    setZones((prev) =>
      prev.map((z, i) =>
        i === index
          ? { ...z, [field]: field === "fee_ngn" ? (parseInt(value, 10) || 0) : value }
          : z
      )
    );
  }

  async function handleSave() {
    const invalid = zones.some((z) => z.area.trim() === "");
    if (invalid) {
      toast.error("All zones must have an area name.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_zones: zones.map((z) => ({ area: z.area.trim(), fee_ngn: z.fee_ngn })),
        }),
      });
      if (!res.ok) {
        toast.error("Failed to save delivery zones.");
        return;
      }
      toast.success("Delivery zones saved.");
      router.refresh();
    } catch {
      toast.error("Failed to save delivery zones.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60">
      <p
        className="text-xs font-black uppercase tracking-wider text-stone-400"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Delivery Zones
      </p>
      <h2
        className="mt-1 text-lg font-black text-zinc-800"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Per-area delivery pricing
      </h2>
      <p className="mt-1 text-xs text-stone-400" style={{ fontFamily: "var(--font-inter)" }}>
        Set a delivery fee for each area you serve. Customers outside these areas will be prompted to contact you on WhatsApp for a quote.
      </p>

      <div className="mt-6 space-y-3">
        {zones.length === 0 && (
          <p className="text-sm text-stone-400 italic" style={{ fontFamily: "var(--font-inter)" }}>
            No zones added yet. Add one below.
          </p>
        )}
        {zones.map((zone, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={zone.area}
              onChange={(e) => updateZone(index, "area", e.target.value)}
              placeholder="e.g. Yaba"
              maxLength={100}
              className="h-10 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              style={{ fontFamily: "var(--font-inter)" }}
            />
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-stone-400">
                ₦
              </span>
              <input
                type="number"
                min={0}
                step={100}
                value={zone.fee_ngn}
                onChange={(e) => updateZone(index, "fee_ngn", e.target.value)}
                placeholder="0"
                className="h-10 w-28 rounded-xl border border-stone-200 bg-white pl-7 pr-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeZone(index)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-400 transition-colors hover:border-red-300 hover:text-red-500"
              aria-label={`Remove ${zone.area || "zone"}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addZone}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-stone-300 px-4 py-2 text-sm font-medium text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-700"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add area
        </button>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Saving…" : "Save Zones"}
        </button>
      </div>
    </div>
  );
}
