import { CalendarDays, Truck } from "lucide-react";

const schedule = [
  { icon: CalendarDays, label: "Orders", value: "Monday–Thursday" },
  { icon: Truck, label: "Delivery", value: "Saturdays" },
] as const;

/**
 * Permanent ordering schedule. Always visible on the shop, whether or not
 * the ordering window is currently open.
 */
export function OrderingSchedule() {
  return (
    <div className="mb-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {schedule.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 outline outline-1 outline-stone-200"
        >
          <Icon className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
          <span
            className="text-[10px] font-bold uppercase tracking-widest text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {label}
          </span>
          <span
            className="text-xs font-bold text-zinc-800 sm:text-sm"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
