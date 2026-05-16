import { getActiveProductsWithStartingPriceForShop } from "@/lib/shop/products";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { OrderingClosedBanner } from "@/components/shop/OrderingClosedBanner";
import { ShopContent } from "@/components/shop/ShopContent";

export default async function ShopGrid() {
  const [products, ordering] = await Promise.all([
    getActiveProductsWithStartingPriceForShop(),
    getOrderingConfig(),
  ]);

  const freshProduce = products.filter((p) => p.type === "fresh_produce");
  const cookingKits = products.filter((p) => p.type === "cooking_kit");

  return (
    <section className="bg-stone-100 py-24 sm:py-28">
      <OrderingClosedBanner
        isOpen={ordering.is_ordering_open}
        cutoffMessage={ordering.cutoff_message}
        nextDeliveryDate={ordering.next_delivery_date}
      />

      <div className="mx-auto max-w-7xl px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p
            className="inline-flex items-center rounded-full bg-green-300 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-900"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            Freshly prepped, never frozen
          </p>
          <h1
            className="mt-6 text-5xl font-black text-zinc-800 sm:text-6xl"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            The Local-Global Menu
          </h1>
          <p
            className="mt-4 text-base leading-6 text-stone-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Choose your kits and produce for the week. Tap any item to select
            options, then add it to your order.
          </p>
        </div>

        <ShopContent freshProduce={freshProduce} cookingKits={cookingKits} />
      </div>
    </section>
  );
}
