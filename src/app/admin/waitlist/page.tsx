import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getWaitlistSignups } from "@/lib/admin/waitlist";
import { WaitlistTable } from "@/components/admin/waitlist/WaitlistTable";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const entries = await getWaitlistSignups();

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
          Waitlist
        </h1>
        <p className="mt-2 text-sm text-stone-500" style={{ fontFamily: "var(--font-inter)" }}>
          People who signed up at{" "}
          <span className="font-semibold text-stone-600">/waitlist</span> to be notified when
          rodo&amp;co launches in their area.
        </p>
      </div>

      <WaitlistTable initialEntries={entries} />
    </div>
  );
}
