"use client";

import * as React from "react";
import * as Lucide from "lucide-react";
import { cn } from "@/lib/utils";

export type EmailLog = {
  id: string;
  type: string;
  to: string;
  subject: string;
  status: string;
  resend_id: string | null;
  error: string | null;
  order_reference: string | null;
  sent_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  order_receipt: "Order Receipt",
  admin_alert: "Admin Alert",
  admin_invite: "Admin Invite",
  delivery_reminder: "Delivery Reminder",
};

const TYPE_COLORS: Record<string, string> = {
  order_receipt: "bg-blue-50 text-blue-700",
  admin_alert: "bg-orange-50 text-orange-700",
  admin_invite: "bg-purple-50 text-purple-700",
  delivery_reminder: "bg-green-50 text-green-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EmailLogsTable({ logs }: { logs: EmailLog[] }) {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filtered = logs.filter((log) => {
    if (typeFilter !== "all" && log.type !== typeFilter) return false;
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.to.toLowerCase().includes(q) ||
        log.subject.toLowerCase().includes(q) ||
        (log.order_reference?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Lucide.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search recipient, subject, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          <option value="all">All types</option>
          <option value="order_receipt">Order Receipt</option>
          <option value="admin_alert">Admin Alert</option>
          <option value="admin_invite">Admin Invite</option>
          <option value="delivery_reminder">Delivery Reminder</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          <option value="all">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-stone-400">
            <Lucide.Mail className="h-8 w-8" />
            <p className="text-sm font-medium" style={{ fontFamily: "var(--font-quicksand)" }}>
              No emails found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-bold uppercase tracking-wider text-stone-400">
                  <th className="px-4 py-3" style={{ fontFamily: "var(--font-quicksand)" }}>Type</th>
                  <th className="px-4 py-3" style={{ fontFamily: "var(--font-quicksand)" }}>Recipient</th>
                  <th className="px-4 py-3" style={{ fontFamily: "var(--font-quicksand)" }}>Subject</th>
                  <th className="px-4 py-3" style={{ fontFamily: "var(--font-quicksand)" }}>Status</th>
                  <th className="px-4 py-3" style={{ fontFamily: "var(--font-quicksand)" }}>Reference</th>
                  <th className="px-4 py-3" style={{ fontFamily: "var(--font-quicksand)" }}>Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                          TYPE_COLORS[log.type] ?? "bg-stone-100 text-stone-600",
                        )}
                        style={{ fontFamily: "var(--font-quicksand)" }}
                      >
                        {TYPE_LABELS[log.type] ?? log.type}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-zinc-700 max-w-[200px] truncate"
                      title={log.to}
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {log.to}
                    </td>
                    <td
                      className="px-4 py-3 text-zinc-600 max-w-[260px] truncate"
                      title={log.subject}
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {log.subject}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === "sent" ? (
                        <span className="flex items-center gap-1.5 text-green-700">
                          <Lucide.CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-bold text-xs" style={{ fontFamily: "var(--font-quicksand)" }}>Sent</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-600" title={log.error ?? ""}>
                          <Lucide.XCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-bold text-xs" style={{ fontFamily: "var(--font-quicksand)" }}>Failed</span>
                        </span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-stone-500"
                    >
                      {log.order_reference ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {formatDate(log.sent_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p
        className="text-xs text-stone-400"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        {filtered.length} of {logs.length} emails
      </p>
    </div>
  );
}
