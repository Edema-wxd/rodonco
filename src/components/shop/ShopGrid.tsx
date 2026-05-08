import { getActiveProductsWithStartingPriceForShop } from "@/lib/shop/products";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { OrderingClosedBanner } from "@/components/shop/OrderingClosedBanner";
import { ProductCard } from "@/components/shop/ProductCard";

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
            Choose your kits and produce for the week. Tap any item to select options, then add it to your order.
          </p>
        </div>

        <div className="space-y-20">
          <section>
            <div className="flex items-end justify-between gap-6 pb-6">
              <div>
                <h2
                  className="text-4xl font-black uppercase leading-10 text-zinc-800"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  Fresh <span className="text-green-800">Produce</span>
                </h2>
                <p
                  className="mt-2 text-sm text-stone-600"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {freshProduce.length} items
                </p>
              </div>
            </div>

            {freshProduce.length ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {freshProduce.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    startingPriceNgn={product.starting_price_ngn}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-600" style={{ fontFamily: "var(--font-inter)" }}>
                No products available yet.
              </p>
            )}
          </section>

          <section>
            <div className="flex items-end justify-between gap-6 pb-6">
              <div>
                <h2
                  className="text-4xl font-black uppercase leading-10 text-zinc-800"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  Cooking <span className="text-red-700">Kits</span>
                </h2>
                <p
                  className="mt-2 text-sm text-stone-600"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {cookingKits.length} items
                </p>
              </div>
            </div>

            {cookingKits.length ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cookingKits.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    startingPriceNgn={product.starting_price_ngn}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-600" style={{ fontFamily: "var(--font-inter)" }}>
                No products available yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
