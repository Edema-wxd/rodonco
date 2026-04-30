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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <OrderingClosedBanner
        isOpen={ordering.is_ordering_open}
        cutoffMessage={ordering.cutoff_message}
        nextDeliveryDate={ordering.next_delivery_date}
      />

      <div className="space-y-10">
        <section>
          <h2 className="border-b pb-2 text-xl font-bold">Fresh Produce</h2>

          {freshProduce.length ? (
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {freshProduce.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  startingPriceNgn={product.starting_price_ngn}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No products available</p>
          )}
        </section>

        <section>
          <h2 className="border-b pb-2 text-xl font-bold">Cooking Kits</h2>

          {cookingKits.length ? (
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cookingKits.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  startingPriceNgn={product.starting_price_ngn}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No products available</p>
          )}
        </section>
      </div>
    </div>
  );
}

