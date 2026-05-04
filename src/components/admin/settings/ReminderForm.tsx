"use client";

import { useState } from "react";

export function ReminderForm() {
  const [weekOf, setWeekOf] = useState("");
  const [result, setResult] = useState<string | null>(null);
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
        setResult(
          `${data.sent} reminder email${data.sent === 1 ? "" : "s"} sent.`
        );
      } else {
        setResult("Failed to send reminders. Check server logs.");
      }
    } catch {
      setResult("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">
        Send Delivery Reminders
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Send reminder emails to all paid orders for a delivery week.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="reminder-week-of"
            className="block text-sm font-medium text-gray-700"
          >
            Delivery week (Saturday)
          </label>
          <input
            id="reminder-week-of"
            type="date"
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !weekOf}
          className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending\u2026" : "Send Reminders"}
        </button>
        {result && (
          <p className="text-sm text-gray-700" aria-live="polite">
            {result}
          </p>
        )}
      </form>
    </div>
  );
}
