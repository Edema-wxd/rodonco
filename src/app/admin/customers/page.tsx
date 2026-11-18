import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AbandonedCartsTable } from "@/components/admin/customers/AbandonedCartsTable";
import { CustomersTable } from "@/components/admin/customers/CustomersTable";
import { CustomersTabs, type CustomersView } from "@/components/admin/customers/CustomersTabs";
import { getAbandonedCarts, getUncContactedCount } from "@/lib/admin/abandonedCarts";
import { getAdminCustomers } from "@/lib/admin/customers";
import { ABANDONED_CARTS_PAGE_SIZE } from "./_constants";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; view?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const { search, view: rawView } = await searchParams;
  const view: CustomersView = rawView === "abandoned" ? "abandoned" : "customers";

  const [abandonedCount, content] = await Promise.all([
    getUncContactedCount(),
    view === "abandoned"
      ? getAbandonedCarts({ limit: ABANDONED_CARTS_PAGE_SIZE }).then((carts) => (
          <AbandonedCartsTable initialCarts={carts} />
        ))
      : getAdminCustomers({ search }).then((customers) => (
          <CustomersTable customers={customers} />
        )),
  ]);

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
          Customers
        </h1>
        {view === "abandoned" ? (
          <p
            className="mt-2 text-sm text-stone-500"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            People who entered their details at checkout but never paid. Contact them to recover
            the sale. Records are deleted automatically after 90 days.
          </p>
        ) : null}
        <div className="mt-5">
          <CustomersTabs active={view} abandonedCount={abandonedCount} />
        </div>
      </div>

      {content}
    </div>
  );
}
