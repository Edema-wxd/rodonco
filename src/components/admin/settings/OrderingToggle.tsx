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

  const saveDisabled = submitting || pendingClose || isOpen === lastSavedIsOpen;

  return (
    <div className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60">
      {/* Section label */}
      <p
        className="text-xs font-black uppercase tracking-wider text-stone-400"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Ordering Window
      </p>

      {/* Status display */}
      <div
        className={[
          "mt-4 text-3xl font-black leading-tight",
          isOpen ? "text-green-700" : "text-red-600",
        ].join(" ")}
        style={{ fontFamily: "var(--font-quicksand)" }}
        aria-live="polite"
      >
        {isOpen ? "✓ Ordering is OPEN" : "✗ Ordering is CLOSED"}
      </div>

      {/* Toggle row */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-5 py-4">
        <Label
          htmlFor="ordering-switch"
          className="text-sm font-bold text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Enable ordering
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
      {pendingClose ? (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
          <p
            className="flex items-center gap-2 text-sm font-bold text-red-700"
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
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Yes, Close
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={cancelClose}
              className="rounded-full bg-white px-5 py-2 text-sm font-bold text-stone-500 transition-colors hover:bg-stone-100 disabled:opacity-50"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* Save row */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => void patchConfig(isOpen)}
          disabled={saveDisabled}
          className="rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Save Settings
        </button>
        <span
          className={
            "text-sm font-bold text-green-700 transition-opacity duration-1000 " +
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
