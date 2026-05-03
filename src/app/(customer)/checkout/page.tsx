import { OrderingClosedBanner } from "@/components/shop/OrderingClosedBanner";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { CheckoutExperience } from "@/components/checkout/CheckoutExperience";

export const dynamic = "force-dynamic";

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
          <h1 className="font-heading text-2xl">Checkout unavailable</h1>
          <p className="mt-2 text-muted-foreground">
            Ordering is currently closed. Please check back during the ordering window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl mb-8">Checkout</h1>
      <CheckoutExperience />
    </div>
  );
}
