import Link from "next/link";

import type { Product } from "@/types";
import { AddToOrderButton } from "@/components/shop/AddToOrderButton";

function formatFromPrice(priceNgn: number): string {
  const ngn = Math.floor(priceNgn);
  return `From ₦${ngn.toLocaleString("en-NG")}`;
}

function productTypeLabel(type: Product["type"]): { label: string; className: string } {
  if (type === "cooking_kit") {
    return { label: "Kit", className: "text-red-700" };
  }
  return { label: "Produce", className: "text-green-800" };
}

export function ProductCard({
  product,
  startingPriceNgn,
}: {
  product: Product;
  startingPriceNgn: number;
}) {
  const primaryImage = product.images[0]?.url ?? product.image_url;
  const typeBadge = productTypeLabel(product.type);

  return (
    <div className="group bg-white outline outline-1 outline-stone-200/50 transition-shadow hover:shadow-md flex flex-row-reverse overflow-hidden rounded-2xl sm:block sm:rounded-[32px]">
      {/* Image — right on mobile, full-width top on sm+ */}
      <Link href={`/shop/${product.id}`} scroll={false} className="relative block w-28 min-h-[96px] shrink-0 overflow-hidden bg-stone-100 sm:min-h-0 sm:h-64 sm:w-auto">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="h-16 w-auto opacity-15" />
          </div>
        )}

        <div className="absolute left-4 top-4 hidden gap-2 sm:flex">
          <span
            className={`rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide backdrop-blur-sm ${typeBadge.className}`}
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {typeBadge.label}
          </span>
        </div>
      </Link>

      {/* Content — left on mobile, below image on sm+ */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-4 sm:gap-4 sm:p-8">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <Link href={`/shop/${product.id}`} scroll={false} className="min-w-0 flex-1 sm:pr-4">
            <h3
              className="line-clamp-2 text-sm font-bold leading-snug text-zinc-800 sm:truncate sm:text-2xl sm:leading-8"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              {product.name}
            </h3>
          </Link>
          <span
            className="shrink-0 text-xs font-bold text-red-700 sm:text-base"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {formatFromPrice(startingPriceNgn)}
          </span>
        </div>

        {product.description ? (
          <p className="line-clamp-2 text-xs leading-4 text-stone-500 sm:text-sm sm:leading-5" style={{ fontFamily: "var(--font-inter)" }}>
            {product.description}
          </p>
        ) : null}

        <div className="hidden sm:block">
          <AddToOrderButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}
