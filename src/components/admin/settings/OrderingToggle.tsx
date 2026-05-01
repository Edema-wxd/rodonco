"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Ordering Window</h2>

        <div
          className={[
            "text-[28px] font-semibold leading-tight",
            isOpen ? "text-green-700" : "text-red-700",
          ].join(" ")}
          aria-live="polite"
        >
          {isOpen ? "✓ Ordering is OPEN" : "✗ Ordering is CLOSED"}
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="ordering-switch" className="text-sm font-medium">
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

        {pendingClose ? (
          <div className="space-y-2 rounded-md border border-destructive/30 bg-red-50 p-3">
            <p className="text-sm text-destructive" id="close-confirm-text">
              This will prevent new orders. Confirm?
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={submitting}
                onClick={() => void patchConfig(false)}
                aria-describedby="close-confirm-text"
              >
                Yes, Close
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={submitting}
                onClick={cancelClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button type="button" onClick={() => void patchConfig(isOpen)} disabled={saveDisabled}>
            Save Settings
          </Button>
          <span
            className={
              "text-sm text-green-600 transition-opacity duration-1000 " +
              (savedVisible ? "opacity-100" : "opacity-0")
            }
            role="status"
            aria-hidden={!savedVisible}
          >
            Saved
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

