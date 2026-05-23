"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function ReminderForm() {
  const [weekOf, setWeekOf] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_of: weekOf }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({
          ok: true,
          message: `${data.sent} reminder email${data.sent === 1 ? "" : "s"} sent.`,
        });
      } else {
        setResult({ ok: false, message: "Failed to send reminders. Check server logs." });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60">
      <p
        className="text-xs font-black uppercase tracking-wider text-stone-400"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Delivery Reminders
      </p>
      <h2
        className="mt-2 text-xl font-black text-zinc-800"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Send Delivery Reminders
      </h2>
      <p
        className="mt-2 text-sm leading-6 text-stone-500"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        Send reminder emails to all paid orders for a delivery week.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="reminder-week-of"
            className="block text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Delivery week (Saturday)
          </label>
          <input
            id="reminder-week-of"
            type="date"
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !weekOf}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "Sending…" : "Send Reminders"}
        </button>

        {result ? (
          <p
            className={[
              "flex items-center gap-2 text-sm font-bold",
              result.ok ? "text-green-700" : "text-red-600",
            ].join(" ")}
            style={{ fontFamily: "var(--font-quicksand)" }}
            aria-live="polite"
          >
            {result.ok ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {result.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
