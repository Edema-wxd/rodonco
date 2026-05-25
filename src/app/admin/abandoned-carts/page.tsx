import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getAbandonedCarts } from "@/lib/admin/abandonedCarts";
import { AbandonedCartsTable } from "@/components/admin/abandoned-carts/AbandonedCartsTable";

export const dynamic = "force-dynamic";

export default async function AdminAbandonedCartsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const initialCarts = await getAbandonedCarts();

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
          Abandoned Carts
        </h1>
        <p
          className="mt-2 text-sm text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Customers who submitted checkout details but did not complete payment. Contact them to
          recover the sale.
        </p>
      </div>

      <AbandonedCartsTable initialCarts={initialCarts} />
    </div>
  );
}
