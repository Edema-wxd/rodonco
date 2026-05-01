export type StatCardProps =
  | { variant: "count" | "currency"; label: string; value: number; sublabel?: string; items?: never }
  | { variant: "list"; label: string; items: Array<{ name: string; qty: number }>; value?: never }
  | { variant: "breakdown"; label: string; items: Array<{ label: string; count: number }>; value?: never };

export function StatCard({ label }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-sm uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-sm text-gray-400">Loading…</div>
    </div>
  );
}

