import { Navbar } from "@/components/layout/Navbar";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orderingConfig = await getOrderingConfig();

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <CartSidebar
        isOrderingOpen={orderingConfig.is_ordering_open}
        cutoffMessage={orderingConfig.cutoff_message}
        nextDeliveryDate={orderingConfig.next_delivery_date}
      />
    </>
  );
}
