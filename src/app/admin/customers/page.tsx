import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CustomersTable } from "@/components/admin/customers/CustomersTable";
import { getAdminCustomers } from "@/lib/admin/customers";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const { search } = await searchParams;
  const customers = await getAdminCustomers({ search });

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
      </div>

      <CustomersTable customers={customers} />
    </div>
  );
}
