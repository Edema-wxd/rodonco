import * as Lucide from "lucide-react";

import type { ActivityLogEntry } from "@/lib/admin/activityLog";

type ActionMeta = {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: (entry: ActivityLogEntry) => string;
};

const ACTION_META: Record<string, ActionMeta> = {
  "auth.login": {
    Icon: Lucide.LogIn,
    color: "text-green-600 bg-green-50",
    label: () => "Signed in",
  },
  "auth.logout": {
    Icon: Lucide.LogOut,
    color: "text-stone-500 bg-stone-100",
    label: () => "Signed out",
  },
  "order.status_changed": {
    Icon: Lucide.ArrowRight,
    color: "text-amber-600 bg-amber-50",
    label: (e) => {
      const d = e.details;
      const label = e.entity_label ?? "order";
      if (d?.from && d?.to) return `${label}: ${d.from} → ${d.to}`;
      return `Updated ${label} status`;
    },
  },
  "order.deleted": {
    Icon: Lucide.Trash2,
    color: "text-red-600 bg-red-50",
    label: (e) => `Deleted order ${e.entity_label ?? ""}`,
  },
  "order.bulk_status_changed": {
    Icon: Lucide.Layers,
    color: "text-blue-600 bg-blue-50",
    label: (e) => {
      const d = e.details;
      if (d?.from && d?.to && d?.count != null)
        return `Bulk ${d.from} → ${d.to} (${d.count} order${Number(d.count) === 1 ? "" : "s"})`;
      return "Bulk status update";
    },
  },
  "product.created": {
    Icon: Lucide.Plus,
    color: "text-green-600 bg-green-50",
    label: (e) => `Created "${e.entity_label ?? "product"}"`,
  },
  "product.updated": {
    Icon: Lucide.Pencil,
    color: "text-blue-600 bg-blue-50",
    label: (e) => `Updated "${e.entity_label ?? "product"}"`,
  },
  "product.deleted": {
    Icon: Lucide.Trash2,
    color: "text-red-600 bg-red-50",
    label: (e) => `Deleted "${e.entity_label ?? "product"}"`,
  },
  "settings.ordering_config_updated": {
    Icon: Lucide.Settings2,
    color: "text-stone-600 bg-stone-100",
    label: () => "Updated ordering config",
  },
  "settings.site_settings_updated": {
    Icon: Lucide.Settings2,
    color: "text-stone-600 bg-stone-100",
    label: () => "Updated site settings",
  },
  "system.payment_amount_mismatch": {
    Icon: Lucide.AlertOctagon,
    color: "text-red-600 bg-red-50",
    label: (e) => `Amount mismatch on ${e.entity_label ?? "order"}`,
  },
  "system.payment_failed": {
    Icon: Lucide.XCircle,
    color: "text-red-500 bg-red-50",
    label: (e) => `Payment failed for ${e.entity_label ?? "order"}`,
  },
  "order.refunded": {
    Icon: Lucide.RotateCcw,
    color: "text-slate-600 bg-slate-100",
    label: (e) => `Refund processed for ${e.entity_label ?? "order"}`,
  },
  "system.payment_disputed": {
    Icon: Lucide.ShieldAlert,
    color: "text-orange-600 bg-orange-50",
    label: (e) => `Dispute opened on ${e.entity_label ?? "order"}`,
  },
};

function formatTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <Lucide.ClipboardList className="h-8 w-8 text-stone-300" />
        <p
          className="text-sm font-bold text-stone-400"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          No activity recorded yet
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100">
            {(["Time", "Action", "Admin"] as const).map((h) => (
              <th
                key={h}
                className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-stone-400"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {entries.map((entry) => {
            const meta = ACTION_META[entry.action] ?? {
              Icon: Lucide.Activity,
              color: "text-stone-500 bg-stone-100",
              label: (e: ActivityLogEntry) => e.action,
            };
            const { Icon, color, label } = meta;

            return (
              <tr key={entry.id} className="transition-colors hover:bg-stone-50/50">
                <td
                  className="whitespace-nowrap px-6 py-4 tabular-nums text-stone-400"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {formatTs(entry.created_at)}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span
                      className="font-semibold text-zinc-800"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {label(entry)}
                    </span>
                  </span>
                </td>
                <td
                  className="px-6 py-4 text-stone-500"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {entry.admin_email}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
