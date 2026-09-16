import Image from "next/image";
import Link from "next/link";

import { getCachedMenuPreviewConfig } from "@/lib/homepage/menuPreview";
import { selectMenuPreviewProducts } from "@/lib/homepage/menuPreviewShared";
import {
  getActiveProductsWithStartingPriceForShop,
  type ActiveProductWithStartingPrice,
} from "@/lib/shop/products";

function formatFromPrice(priceNgn: number): string {
  const ngn = Math.floor(priceNgn);
  return `From ₦${ngn.toLocaleString("en-NG")}`;
}

function MenuPreviewCard({
  product,
  buttonLabel,
  className,
}: {
  product: ActiveProductWithStartingPrice;
  buttonLabel: string;
  className: string;
}) {
  const image = product.images[0]?.url ?? product.image_url;
  const comingSoon = product.coming_soon;

  return (
    <div className={`overflow-hidden rounded-[32px] bg-white outline outline-1 outline-stone-200/50 ${className}`}>
      {/* Image */}
      <div className="relative h-64 overflow-hidden bg-stone-100">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className={comingSoon ? "scale-105 object-cover blur-md saturate-[0.85]" : "object-cover"}
            unoptimized
            aria-hidden={comingSoon || undefined}
          />
        ) : null}
        {comingSoon ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/25">
            <span
              className="rounded-full bg-zinc-900/85 px-5 py-2 text-xs font-black uppercase tracking-widest text-white backdrop-blur-sm"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Coming Soon
            </span>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 p-8">
        <div className="flex items-start justify-between">
          <h3
            className="flex-1 pr-4 text-2xl font-bold leading-8 text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {product.name}
          </h3>
          <span
            className={`text-xl font-bold ${comingSoon ? "text-stone-400" : "text-red-700"}`}
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {comingSoon ? "Soon" : formatFromPrice(product.starting_price_ngn)}
          </span>
        </div>
        {product.description ? (
          <p
            className="text-sm leading-5 text-stone-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {product.description}
          </p>
        ) : null}
        {comingSoon ? (
          <p
            className="w-full rounded-full bg-stone-50 py-4 text-center text-base font-bold text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Coming Soon
          </p>
        ) : (
          <Link
            href={`/shop/${product.id}`}
            scroll={false}
            className="w-full cursor-pointer rounded-full bg-stone-100 py-4 text-center text-base font-bold text-zinc-800 transition-all duration-150 hover:bg-red-600 hover:text-white active:scale-[0.97] active:bg-red-700"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {buttonLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export async function MenuPreview() {
  const [config, products] = await Promise.all([
    getCachedMenuPreviewConfig(),
    getActiveProductsWithStartingPriceForShop(),
  ]);

  if (!config.is_visible) return null;

  const items = selectMenuPreviewProducts(products, config.product_ids);
  if (items.length === 0) return null;

  return (
    <section className="bg-stone-100 py-32">
      <div className="mx-auto max-w-7xl px-8">
        {/* Centered header */}
        <div className="mx-auto mb-16 max-w-2xl text-start sm:text-center">
          <h2
            className="text-4xl font-black text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {config.heading}
            {config.heading_accent ? (
              <>
                {" "}
                <span className="text-red-600">{config.heading_accent}</span>
              </>
            ) : null}
          </h2>
          {config.subheading ? (
            <p
              className="mt-4 text-base leading-6 text-stone-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {config.subheading}
            </p>
          ) : null}
        </div>

        {/* Card grid - swipe on mobile, grid on md+ */}
        <div>
          {/* Mobile: horizontal swipe, hidden on md+ */}
          <div className="flex -mx-4 overflow-x-auto pb-2 md:hidden" style={{ WebkitOverflowScrolling: "touch" }}>
            {items.map((product) => (
              <MenuPreviewCard
                key={product.id}
                product={product}
                buttonLabel={config.card_button_label}
                className="min-w-[85vw] max-w-xs mx-4 shrink-0"
              />
            ))}
          </div>
          {/* Desktop: normal grid, hidden on mobile */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {items.map((product) => (
              <MenuPreviewCard
                key={product.id}
                product={product}
                buttonLabel={config.card_button_label}
                className=""
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 flex justify-center">
          <Link
            href={config.cta_href}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-all duration-200 hover:-translate-y-1 hover:bg-red-500 hover:shadow-[0px_28px_32px_-5px_rgba(236,45,1,0.40)] active:translate-y-0 active:scale-[0.97] active:shadow-[0px_10px_15px_-5px_rgba(236,45,1,0.30)]"
          >
            <span
              className="text-lg font-bold text-rose-50"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              {config.cta_label}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
