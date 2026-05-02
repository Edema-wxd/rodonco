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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <OrderingClosedBanner
        isOpen={ordering.is_ordering_open}
        cutoffMessage={ordering.cutoff_message}
        nextDeliveryDate={ordering.next_delivery_date}
      />

      <div className="space-y-14">
        <section>
          <div className="flex items-baseline gap-3 pb-5 border-b border-border">
            <h2 className="font-heading text-3xl italic text-foreground">Fresh Produce</h2>
            <span className="text-sm text-muted-foreground">{freshProduce.length} items</span>
          </div>

          {freshProduce.length ? (
            <div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {freshProduce.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  startingPriceNgn={product.starting_price_ngn}
                />
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">No products available yet.</p>
          )}
        </section>

        <section>
          <div className="flex items-baseline gap-3 pb-5 border-b border-border">
            <h2 className="font-heading text-3xl italic text-foreground">Cooking Kits</h2>
            <span className="text-sm text-muted-foreground">{cookingKits.length} items</span>
          </div>

          {cookingKits.length ? (
            <div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cookingKits.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  startingPriceNgn={product.starting_price_ngn}
                />
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">No products available yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
