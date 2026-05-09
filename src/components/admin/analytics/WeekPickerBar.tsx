"use client";

import { useRouter } from "next/navigation";

interface Props {
  currentWeek: string;
}

export function WeekPickerBar({ currentWeek }: Props) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="analytics-week"
        className="text-xs font-black uppercase tracking-wider text-stone-400"
        style={{ fontFamily: "var(--font-lexend)" }}
      >
        Filter by week
      </label>
      <input
        id="analytics-week"
        type="date"
        defaultValue={currentWeek}
        onChange={(e) => {
          if (e.target.value) {
            router.push(`/admin/analytics?week=${e.target.value}`);
          }
        }}
        className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        style={{ fontFamily: "var(--font-inter)" }}
      />
    </div>
  );
}
