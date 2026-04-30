import Link from "next/link";

import { ProductDrawer } from "@/components/shop/ProductDrawer";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { getProductDetailsById } from "@/lib/shop/productDetails";

export default async function DrawerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [ordering, details] = await Promise.all([getOrderingConfig(), getProductDetailsById(slug)]);

  if (!details) {
    return (
      <div className="fixed inset-0 z-[70]">
        <div className="absolute inset-0 bg-black/40" />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Product not found"
          className={[
            "absolute bottom-0 left-0 right-0 flex max-h-[70vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl",
            "sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[520px] sm:rounded-none",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b px-4 py-4">
            <p className="text-sm font-semibold text-black">Product not found</p>
            <Link
              href="/shop"
              scroll={false}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-black hover:bg-black/5"
            >
              Close
            </Link>
          </div>
          <div className="px-4 py-6">
            <p className="text-sm text-black/70">
              This product doesn’t exist (or is no longer available).
            </p>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <ProductDrawer
      product={details.product}
      variants={details.variants}
      prepOptions={details.prepOptions}
      isOrderingOpen={ordering.is_ordering_open}
      cutoffMessage={ordering.cutoff_message}
      nextDeliveryDate={ordering.next_delivery_date}
    />
  );
}
