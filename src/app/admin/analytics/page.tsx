import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { StatCard } from "@/components/admin/analytics/StatCard";
import { WeekPickerBar } from "@/components/admin/analytics/WeekPickerBar";
import { getWeeklyAnalytics } from "@/lib/admin/analytics";
import { formatWeekRange } from "@/lib/admin/week";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const { week } = await searchParams;
  const analytics = await getWeeklyAnalytics(week);

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <p
          className="text-sm font-black uppercase tracking-wider text-red-600"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Admin
        </p>
        <h1
          className="mt-2 text-3xl font-black leading-[1.05] text-zinc-800 sm:text-5xl"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Analytics
        </h1>
        <p
          className="mt-2 text-base text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Week of {formatWeekRange(analytics.week)}
        </p>
      </div>

      <div className="mb-6">
        <WeekPickerBar currentWeek={analytics.week} />
      </div>

      <p
        className="mb-6 text-xs text-stone-400"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        Revenue and order totals include paid, processing, and delivered orders only.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StatCard
          label="Total Orders"
          value={analytics.totalOrders}
          variant="count"
          sublabel="this week"
        />
        <StatCard
          label="Total Revenue"
          value={analytics.totalRevenue}
          variant="currency"
          sublabel="this week"
        />
        <div className="sm:col-span-2">
          <StatCard
            label="Top Products"
            variant="list"
            items={analytics.topProducts.map((p) => ({ name: p.name, qty: p.qty }))}
          />
        </div>
        <div className="sm:col-span-2">
          <StatCard
            label="Order Status"
            variant="breakdown"
            items={analytics.statusBreakdown.map((s) => ({ label: s.status, count: s.count }))}
          />
        </div>
      </div>
    </div>
  );
}
