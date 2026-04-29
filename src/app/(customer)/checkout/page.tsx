import { OrderingClosedBanner } from "@/components/shop/OrderingClosedBanner";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";

export default async function CheckoutPage() {
  const orderingConfig = await getOrderingConfig();

  if (!orderingConfig.is_ordering_open) {
    return (
      <div className="min-h-[50vh]">
        <OrderingClosedBanner
          isOpen={false}
          cutoffMessage={orderingConfig.cutoff_message}
          nextDeliveryDate={orderingConfig.next_delivery_date}
        />

        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Checkout unavailable</h1>
          <p className="mt-2 text-gray-600">Ordering is currently closed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="mt-2 text-gray-600">Checkout form coming soon.</p>
    </div>
  );
}
