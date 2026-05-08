import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { StatCard } from "@/components/admin/analytics/StatCard";
import { getWeeklyAnalytics } from "@/lib/admin/analytics";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const analytics = await getWeeklyAnalytics();

  return (
    <div className="min-h-screen bg-stone-100 p-8">
      <div className="mb-8">
        <p
          className="text-sm font-black uppercase tracking-wider text-red-600"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Admin
        </p>
        <h1
          className="mt-2 text-5xl font-black leading-[1.05] text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Analytics
        </h1>
        <p
          className="mt-2 text-base text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Week of {analytics.week}
        </p>
      </div>

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
