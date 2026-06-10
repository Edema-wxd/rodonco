import Image from "next/image";
import Link from "next/link";

import { getActiveProductsWithStartingPriceForShop } from "@/lib/shop/products";

function formatFromPrice(priceNgnKobo: number): string {
  const ngn = Math.floor(priceNgnKobo / 100);
  return `From ₦${ngn.toLocaleString("en-NG")}`;
}

export async function MenuPreview() {
  const products = await getActiveProductsWithStartingPriceForShop();
  const kits = products.filter((p) => p.type === "cooking_kit").slice(0, 3);

  if (kits.length === 0) return null;

  return (
    <section className="bg-stone-100 py-32">
      <div className="mx-auto max-w-7xl px-8">
        {/* Centered header */}
        <div className="mx-auto mb-16 max-w-2xl text-start sm:text-center">
          <h2
            className="text-4xl font-black text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Ready for the <span className="text-red-600">Pot.</span>

          </h2>
          <p
            className="mt-4 text-base leading-6 text-stone-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Check out our curated kits, prepped to make cooking easier.
          </p>
        </div>

        {/* Card grid - swipe on mobile, grid on md+ */}
        <div>
          {/* Mobile: horizontal swipe, hidden on md+ */}
          <div className="flex -mx-4 overflow-x-auto pb-2 md:hidden" style={{ WebkitOverflowScrolling: "touch" }}>
            {kits.map((kit) => {
              const image = kit.images[0]?.url ?? kit.image_url;
              return (
                <div
                  key={kit.id}
                  className="min-w-[85vw] max-w-xs mx-4 shrink-0 overflow-hidden rounded-[32px] bg-white outline outline-1 outline-stone-200/50"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden bg-stone-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={kit.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-4 p-8">
                    <div className="flex items-start justify-between">
                      <h3
                        className="flex-1 pr-4 text-2xl font-bold leading-8 text-zinc-800"
                        style={{ fontFamily: "var(--font-quicksand)" }}
                      >
                        {kit.name}
                      </h3>
                      <span
                        className="text-xl font-bold text-red-700"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {formatFromPrice(kit.starting_price_ngn)}
                      </span>
                    </div>
                    {kit.description ? (
                      <p
                        className="text-sm leading-5 text-stone-600"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {kit.description}
                      </p>
                    ) : null}
                    <Link
                      href={`/shop/${kit.id}`}
                      scroll={false}
                      className="w-full cursor-pointer rounded-full bg-stone-100 py-4 text-center text-base font-bold text-zinc-800 transition-all duration-150 hover:bg-red-600 hover:text-white active:scale-[0.97] active:bg-red-700"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      Add to Box
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop: normal grid, hidden on mobile */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {kits.map((kit) => {
              const image = kit.images[0]?.url ?? kit.image_url;
              return (
                <div
                  key={kit.id}
                  className="overflow-hidden rounded-[32px] bg-white outline outline-1 outline-stone-200/50"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden bg-stone-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={kit.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-4 p-8">
                    <div className="flex items-start justify-between">
                      <h3
                        className="flex-1 pr-4 text-2xl font-bold leading-8 text-zinc-800"
                        style={{ fontFamily: "var(--font-quicksand)" }}
                      >
                        {kit.name}
                      </h3>
                      <span
                        className="text-xl font-bold text-red-700"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {formatFromPrice(kit.starting_price_ngn)}
                      </span>
                    </div>
                    {kit.description ? (
                      <p
                        className="text-sm leading-5 text-stone-600"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {kit.description}
                      </p>
                    ) : null}
                    <Link
                      href={`/shop/${kit.id}`}
                      scroll={false}
                      className="w-full cursor-pointer rounded-full bg-stone-100 py-4 text-center text-base font-bold text-zinc-800 transition-all duration-150 hover:bg-red-600 hover:text-white active:scale-[0.97] active:bg-red-700"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      Add to Box
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* CTA */}
        <div className="mt-16 flex justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-all duration-200 hover:-translate-y-1 hover:bg-red-500 hover:shadow-[0px_28px_32px_-5px_rgba(236,45,1,0.40)] active:translate-y-0 active:scale-[0.97] active:shadow-[0px_10px_15px_-5px_rgba(236,45,1,0.30)]"
          >
            <span
              className="text-lg font-bold text-rose-50"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              View All Products
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
