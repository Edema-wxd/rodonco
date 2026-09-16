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
    <div className="mb-10 flex justify-center">
      <div className="flex items-center rounded-full bg-white px-3.5 py-2.5 shadow-sm outline outline-1 outline-stone-200 sm:px-6">
        {schedule.map(({ icon: Icon, label, value }, i) => (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <span className="mx-3 h-5 w-px bg-stone-200 sm:mx-5" aria-hidden="true" />
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Icon className="hidden h-4 w-4 shrink-0 text-stone-400 min-[400px]:block" aria-hidden="true" />
              <span
                className="text-[10px] font-bold uppercase tracking-wider text-stone-400 sm:tracking-widest"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                {label}
              </span>
              <span
                className="whitespace-nowrap text-xs font-bold text-zinc-800 sm:text-sm"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
