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
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
      <p className="mt-1 text-sm text-gray-500">Week of {analytics.week}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
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

