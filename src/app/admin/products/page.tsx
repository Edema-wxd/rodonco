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
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">Products</h1>
      <div className="mt-6">
        <ProductsList initialProducts={initialProducts} />
      </div>
    </div>
  );
}

