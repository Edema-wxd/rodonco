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
          message: `${data.sent} reminder${data.sent === 1 ? "" : "s"} sent.`,
        });
      } else {
        setResult({ ok: false, message: "Failed to send. Check server logs." });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-tl-[28px] rounded-tr-xl rounded-bl-xl rounded-br-[28px] bg-white p-6 shadow-sm outline outline-1 outline-stone-200/60 flex flex-col">
      <p
        className="text-[10px] font-black uppercase tracking-widest text-stone-400"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Delivery Reminders
      </p>
      <h2
        className="mt-1.5 text-lg font-black text-zinc-800"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Send reminders
      </h2>
      <p
        className="mt-1 text-sm text-stone-500 leading-relaxed"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        Email all paid customers for a given delivery week.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reminder-week-of"
            className="text-[10px] font-black uppercase tracking-widest text-stone-400"
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

        <div className="mt-auto flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !weekOf}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {loading ? "Sending…" : "Send"}
          </button>

          {result && (
            <p
              className={[
                "flex items-center gap-1.5 text-sm font-semibold",
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
          )}
        </div>
      </form>
    </div>
  );
}
