import Link from "next/link";
import * as Lucide from "lucide-react";

import { auth } from "@/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { getWeeklyAnalytics } from "@/lib/admin/analytics";
import { getAdminOrders } from "@/lib/admin/orders";
import { formatNgn } from "@/lib/admin/format";
import { formatWeekRange } from "@/lib/admin/week";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  {
    href: "/admin/orders",
    label: "Orders",
    description: "View and manage customer orders",
    Icon: Lucide.ShoppingBag,
    accent: "bg-red-600",
    textAccent: "text-red-600",
  },
  {
    href: "/admin/products",
    label: "Products",
    description: "Add, edit, or remove meal kits",
    Icon: Lucide.Package,
    accent: "bg-green-800",
    textAccent: "text-green-800",
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    description: "Weekly orders and revenue breakdown",
    Icon: Lucide.BarChart2,
    accent: "bg-zinc-800",
    textAccent: "text-zinc-800",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    description: "Ordering window and reminders",
    Icon: Lucide.Settings2,
    accent: "bg-stone-400",
    textAccent: "text-stone-500",
  },
] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  paid: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-600" },
  processing: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  delivered: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
  refunded: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

function statusStyle(s: string) {
  return STATUS_STYLES[s] ?? { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    const { expired, error } = await searchParams;
    return (
      <AdminLogin
        sessionExpired={expired === "1"}
        authError={error === "CredentialsSignin"}
      />
    );
  }

  const [analytics, recentOrders] = await Promise.all([
    getWeeklyAnalytics(),
    getAdminOrders({ limit: 6 }),
  ]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6 sm:mb-10">
        <p
          className="text-sm font-black uppercase tracking-wider text-red-600"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Admin Dashboard
        </p>
        <h1
          className="mt-2 text-3xl font-black leading-[1.05] text-zinc-800 sm:text-5xl"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          {greeting}.
        </h1>
        <p
          className="mt-2 text-base text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Week of {formatWeekRange(analytics.week)}
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total orders */}
        <div className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60">
          <p
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Orders this week
          </p>
          <p
            className="mt-4 text-5xl font-black leading-none text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {analytics.totalOrders}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-1 w-12 rounded-full bg-red-600" />
            <span className="h-1 w-4 rounded-full bg-stone-200" />
            <span className="h-1 w-4 rounded-full bg-stone-200" />
          </div>
        </div>

        {/* Revenue */}
        <div className="rounded-tl-2xl rounded-tr-[32px] rounded-bl-[32px] rounded-br-2xl bg-green-800 p-8 shadow-sm">
          <p
            className="text-xs font-black uppercase tracking-wider text-green-300/70"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Revenue this week
          </p>
          <p
            className="mt-4 text-4xl font-black leading-none text-lime-100"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {formatNgn(analytics.totalRevenue)}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-1 w-4 rounded-full bg-green-600" />
            <span className="h-1 w-12 rounded-full bg-green-300" />
            <span className="h-1 w-4 rounded-full bg-green-600" />
          </div>
        </div>

        {/* Top product */}
        <div className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60">
          <p
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Top product
          </p>
          {analytics.topProducts[0] ? (
            <>
              <p
                className="mt-4 text-xl font-bold leading-tight text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                {analytics.topProducts[0].name}
              </p>
              <p
                className="mt-2 text-sm text-stone-500"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                ×{analytics.topProducts[0].qty} sold
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-stone-400" style={{ fontFamily: "var(--font-inter)" }}>
              No data yet
            </p>
          )}
        </div>

        {/* Order status snapshot */}
        <div className="rounded-tl-2xl rounded-tr-[32px] rounded-bl-[32px] rounded-br-2xl bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60">
          <p
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Status snapshot
          </p>
          {analytics.statusBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-stone-400" style={{ fontFamily: "var(--font-inter)" }}>
              No orders yet
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {analytics.statusBreakdown.map((s) => {
                const st = statusStyle(s.status);
                return (
                  <li key={s.status} className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${st.bg} ${st.text}`}
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      {s.status}
                    </span>
                    <span
                      className="text-sm font-bold tabular-nums text-zinc-800"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {s.count}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Recent orders ───────────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-xl font-black text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="border-b-2 border-red-600 pb-0.5 text-xs font-black uppercase tracking-wider text-red-600"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            View all
          </Link>
        </div>

        <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Lucide.ShoppingBag className="h-8 w-8 text-stone-300" />
              <p
                className="text-sm font-bold text-stone-400"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                No orders yet this week
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th
                    className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-stone-400"
                    style={{ fontFamily: "var(--font-quicksand)" }}
                  >
                    Reference
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-stone-400"
                    style={{ fontFamily: "var(--font-quicksand)" }}
                  >
                    Customer
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-stone-400"
                    style={{ fontFamily: "var(--font-quicksand)" }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-stone-400"
                    style={{ fontFamily: "var(--font-quicksand)" }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {recentOrders.map((order) => {
                  const st = statusStyle(order.status);
                  return (
                    <tr key={order.id} className="transition-colors hover:bg-stone-50/50">
                      <td className="px-6 py-4">
                        <Link
                          href="/admin/orders"
                          className="font-bold text-red-600 hover:underline"
                          style={{ fontFamily: "var(--font-quicksand)" }}
                        >
                          #{order.reference}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <p
                          className="font-semibold text-zinc-800"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-stone-400">{order.customer_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${st.bg} ${st.text}`}
                          style={{ fontFamily: "var(--font-quicksand)" }}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {order.status}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-right font-bold tabular-nums text-zinc-800"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {formatNgn(order.total_ngn)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Quick links ─────────────────────────────────────── */}
      <div>
        <h2
          className="mb-5 text-xl font-black text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Quick Access
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map(({ href, label, description, Icon, accent, textAccent }) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-tl-[28px] rounded-tr-2xl rounded-bl-2xl rounded-br-[28px] bg-white p-6 shadow-sm outline outline-1 outline-stone-200/60 transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full ${accent}`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p
                className={`text-base font-black ${textAccent}`}
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                {label}
              </p>
              <p
                className="mt-1 text-xs leading-5 text-stone-500"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {description}
              </p>
              <Lucide.ArrowRight
                className={`absolute right-5 top-6 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 ${textAccent}`}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
