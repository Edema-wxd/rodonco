import { getActiveProductsWithStartingPriceForShop } from "@/lib/shop/products";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { OrderingClosedBanner } from "@/components/shop/OrderingClosedBanner";
import { OrderingSchedule } from "@/components/shop/OrderingSchedule";
import { ShopContent } from "@/components/shop/ShopContent";

export default async function ShopGrid() {
  const [products, ordering] = await Promise.all([
    getActiveProductsWithStartingPriceForShop(),
    getOrderingConfig(),
  ]);

  // Coming-soon teasers stay in their own type's section, listed after
  // everything that can be ordered now (sort is stable, so order is kept).
  const orderableFirst = (a: (typeof products)[number], b: (typeof products)[number]) =>
    Number(a.coming_soon) - Number(b.coming_soon);
  const freshProduce = products.filter((p) => p.type === "fresh_produce").sort(orderableFirst);
  const cookingKits = products.filter((p) => p.type === "cooking_kit").sort(orderableFirst);

  return (
    <section className="bg-stone-100 py-8 sm:py-28">
      <OrderingClosedBanner
        isOpen={ordering.is_ordering_open}
        cutoffMessage={ordering.cutoff_message}
        nextDeliveryDate={ordering.next_delivery_date}
      />

      <div className="mx-auto max-w-7xl px-8">
        {/* Not shown on any screen size; kept for screen readers and search engines. */}
        <h1 className="sr-only">The Local-Global Menu</h1>

        <OrderingSchedule />

        <ShopContent
          freshProduce={freshProduce}
          cookingKits={cookingKits}
        />
      </div>
    </section>
  );
}
