import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CustomerDetail } from "@/components/admin/customers/CustomerDetail";
import { getAdminCustomerByEmail } from "@/lib/admin/customers";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);
  const customer = await getAdminCustomerByEmail(email);

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8">
      {customer ? (
        <CustomerDetail customer={customer} />
      ) : (
        <div className="mx-auto max-w-md py-24 text-center">
          <h1
            className="text-2xl font-black text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Customer not found
          </h1>
          <p
            className="mt-2 text-sm text-stone-500"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            No orders exist for {email}.
          </p>
        </div>
      )}
    </div>
  );
}
