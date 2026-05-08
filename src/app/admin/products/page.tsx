import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ProductsList } from "@/components/admin/products/ProductsList";
import { getAdminProducts } from "@/lib/admin/products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const initialProducts = await getAdminProducts();

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
          Products
        </h1>
      </div>

      <ProductsList initialProducts={initialProducts} />
    </div>
  );
}
