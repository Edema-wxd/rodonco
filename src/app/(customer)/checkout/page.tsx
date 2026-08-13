import { OrderingClosedBanner } from "@/components/shop/OrderingClosedBanner";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { getSiteSettings } from "@/lib/admin/config";
import { CheckoutExperience } from "@/components/checkout/CheckoutExperience";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [orderingConfig, siteSettings] = await Promise.all([
    getOrderingConfig(),
    getSiteSettings(),
  ]);

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
      <h1 className="font-heading text-2xl mb-8">Ready when you are.</h1>
      <CheckoutExperience
        deliveryFeeNgn={orderingConfig.delivery_fee_ngn}
        deliveryZones={orderingConfig.delivery_zones ?? []}
        whatsappNumber={siteSettings?.whatsapp_number ?? null}
        flutterwaveEnabled={!!process.env.FLW_SECRET_KEY}
      />
    </div>
  );
}
