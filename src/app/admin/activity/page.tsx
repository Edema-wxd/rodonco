import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getActivityLogs } from "@/lib/admin/activityLog";
import { ActivityFeed } from "@/components/admin/activity/ActivityFeed";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const entries = await getActivityLogs(200);

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
          Activity Log
        </h1>
        <p
          className="mt-2 text-base text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Last {entries.length} actions across orders, products, settings, and auth.
        </p>
      </div>

      <div className="overflow-hidden rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60">
        <ActivityFeed entries={entries} />
      </div>
    </div>
  );
}
