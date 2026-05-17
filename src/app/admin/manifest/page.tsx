import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ManifestTable } from "@/components/admin/manifest/ManifestTable";
import { getManifestOrders } from "@/lib/admin/manifest";
import { currentWeekOf } from "@/lib/admin/week";

export const dynamic = "force-dynamic";

export default async function AdminManifestPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const { week } = await searchParams;
  const weekOf = week ?? currentWeekOf();
  const orders = await getManifestOrders(weekOf);

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8">
      <div className="mb-6 sm:mb-8 print:mb-4">
        <p
          className="text-sm font-black uppercase tracking-wider text-red-600 print:hidden"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Admin
        </p>
        <h1
          className="mt-2 text-3xl font-black leading-[1.05] text-zinc-800 sm:text-5xl print:text-3xl"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Delivery Manifest
        </h1>
        <p
          className="mt-2 text-base text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Week of {weekOf} — {orders.length} deliveries
        </p>
      </div>

      <ManifestTable orders={orders} currentWeek={weekOf} />
    </div>
  );
}
