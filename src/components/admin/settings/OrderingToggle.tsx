"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function OrderingToggle({ initialIsOpen }: { initialIsOpen: boolean }) {
  const router = useRouter();

  const [isOpen, setIsOpen] = React.useState(initialIsOpen);
  const [lastSavedIsOpen, setLastSavedIsOpen] = React.useState(initialIsOpen);
  const [pendingClose, setPendingClose] = React.useState(false);
  const [savedVisible, setSavedVisible] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!savedVisible) return;
    const t = setTimeout(() => setSavedVisible(false), 2000);
    return () => clearTimeout(t);
  }, [savedVisible]);

  async function patchConfig(nextValue: boolean) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_ordering_open: nextValue }),
      });

      if (!res.ok) {
        toast.error("Failed to save settings.");
        setIsOpen(lastSavedIsOpen);
        setPendingClose(false);
        return;
      }

      setIsOpen(nextValue);
      setLastSavedIsOpen(nextValue);
      setPendingClose(false);
      setSavedVisible(true);
      router.refresh();
    } catch {
      toast.error("Failed to save settings.");
      setIsOpen(lastSavedIsOpen);
      setPendingClose(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSwitchChange(next: boolean) {
    if (!next) {
      setIsOpen(false);
      setPendingClose(true);
      return;
    }
    setIsOpen(true);
    void patchConfig(true);
  }

  function cancelClose() {
    setPendingClose(false);
    setIsOpen(true);
  }

  return (
    <div className="rounded-tl-[28px] rounded-tr-xl rounded-bl-xl rounded-br-[28px] bg-white p-6 shadow-sm outline outline-1 outline-stone-200/60 flex flex-col">
      <p
        className="text-[10px] font-black uppercase tracking-widest text-stone-400"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Ordering Window
      </p>

      {/* Status badge */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={[
            "inline-flex h-2 w-2 rounded-full shrink-0",
            isOpen ? "bg-green-500" : "bg-red-500",
          ].join(" ")}
        />
        <span
          className={[
            "text-xl font-black leading-tight",
            isOpen ? "text-green-700" : "text-red-600",
          ].join(" ")}
          style={{ fontFamily: "var(--font-quicksand)" }}
          aria-live="polite"
        >
          {isOpen ? "Ordering is open" : "Ordering is closed"}
        </span>
      </div>

      {/* Toggle row */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
        <Label
          htmlFor="ordering-switch"
          className="text-sm font-semibold text-zinc-700 cursor-pointer"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Accept orders
        </Label>
        <Switch
          id="ordering-switch"
          checked={isOpen}
          onCheckedChange={handleSwitchChange}
          disabled={submitting}
          aria-label="Toggle ordering window"
        />
      </div>

      {/* Confirm-close panel */}
      {pendingClose && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <p
            className="flex items-center gap-2 text-sm font-semibold text-red-700"
            id="close-confirm-text"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This will prevent new orders. Confirm?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void patchConfig(false)}
              aria-describedby="close-confirm-text"
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Yes, close
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={cancelClose}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-stone-500 border border-stone-200 transition-colors hover:bg-stone-100 disabled:opacity-50"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Save + feedback */}
      <div className="mt-auto pt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void patchConfig(isOpen)}
          disabled={submitting || pendingClose || isOpen === lastSavedIsOpen}
          className="rounded-full bg-zinc-800 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Save
        </button>
        <span
          className={
            "text-sm font-semibold text-green-700 transition-opacity duration-700 " +
            (savedVisible ? "opacity-100" : "opacity-0")
          }
          role="status"
          aria-hidden={!savedVisible}
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Saved ✓
        </span>
      </div>
    </div>
  );
}
