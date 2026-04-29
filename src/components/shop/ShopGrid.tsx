import Link from "next/link";

import { getActiveProductsForShop } from "@/lib/shop/products";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { OrderingClosedBanner } from "@/components/shop/OrderingClosedBanner";
import type { Product } from "@/types";

function ProductCard({ product, orderingOpen }: { product: Product; orderingOpen: boolean }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/shop/${product.id}`} scroll={false} className="block">
        <div className="aspect-[4/3] w-full bg-gray-100">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
              No image yet
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/shop/${product.id}`} scroll={false} className="block">
              <h3 className="truncate text-base font-semibold text-gray-900">{product.name}</h3>
            </Link>
            {product.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{product.description}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href={`/shop/${product.id}`}
            scroll={false}
            className="text-sm font-medium text-gray-900 underline-offset-4 hover:underline"
          >
            View details
          </Link>

          <button
            type="button"
            disabled={!orderingOpen}
            title={orderingOpen ? "Add to order from the product drawer" : "Ordering is closed"}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-semibold",
              orderingOpen
                ? "bg-black text-white hover:bg-black/90"
                : "cursor-not-allowed bg-gray-100 text-gray-500",
            ].join(" ")}
          >
            Add to order
          </button>
        </div>
      </div>
    </div>
  );
}

export default async function ShopGrid() {
  const [products, ordering] = await Promise.all([getActiveProductsForShop(), getOrderingConfig()]);

  const freshProduce = products.filter((p) => p.type === "fresh_produce");
  const cookingKits = products.filter((p) => p.type === "cooking_kit");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Shop</h1>

      <div className="mt-6">
        <OrderingClosedBanner
          isOpen={ordering.is_ordering_open}
          cutoffMessage={ordering.cutoff_message}
          nextDeliveryDate={ordering.next_delivery_date}
        />
      </div>

      <div className="mt-6 space-y-10">
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Fresh Produce</h2>
            <p className="text-sm text-gray-600">{freshProduce.length} item(s)</p>
          </div>

          {freshProduce.length ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {freshProduce.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  orderingOpen={ordering.is_ordering_open}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">No fresh produce available right now.</p>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Cooking Kits</h2>
            <p className="text-sm text-gray-600">{cookingKits.length} item(s)</p>
          </div>

          {cookingKits.length ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cookingKits.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  orderingOpen={ordering.is_ordering_open}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">No cooking kits available right now.</p>
          )}
        </section>
      </div>
    </div>
  );
}

