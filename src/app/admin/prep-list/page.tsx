import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BulkTransitionPanel } from "@/components/admin/prep-list/BulkTransitionPanel";
import { PrepListTable, PrepListWeekInput } from "@/components/admin/prep-list/PrepListTable";
import { getPrepList } from "@/lib/admin/prepList";
import { currentWeekOf } from "@/lib/admin/week";

export const dynamic = "force-dynamic";

export default async function AdminPrepListPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const { week } = await searchParams;
  const weekOf = week ?? currentWeekOf();
  const rows = await getPrepList(weekOf);

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <p
          className="text-sm font-black uppercase tracking-wider text-red-600"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Admin
        </p>
        <h1
          className="mt-2 text-3xl font-black leading-[1.05] text-zinc-800 sm:text-5xl"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Prep List
        </h1>
        <p
          className="mt-2 text-base text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Week of {weekOf} — paid &amp; processing orders
        </p>
      </div>

      {/* Week picker */}
      <div className="mb-6 flex items-center gap-3">
        <label
          htmlFor="prep-week"
          className="text-xs font-black uppercase tracking-wider text-stone-400"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Select week
        </label>
        <PrepListWeekInput currentWeek={weekOf} />
      </div>

      <PrepListTable rows={rows} />

      <BulkTransitionPanel currentWeek={weekOf} />
    </div>
  );
}
