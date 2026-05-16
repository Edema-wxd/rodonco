import Link from "next/link";

import type { Product } from "@/types";
import { AddToOrderButton } from "@/components/shop/AddToOrderButton";

function formatFromPrice(priceNgnKobo: number): string {
  const ngn = Math.floor(priceNgnKobo / 100);
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
    <div className="group overflow-hidden rounded-[32px] bg-white outline outline-1 outline-stone-200/50 transition-shadow hover:shadow-md">
      <Link href={`/shop/products/${product.id}`} className="block overflow-hidden">
        <div className="relative h-64 overflow-hidden bg-stone-100">
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

          <div className="absolute left-4 top-4 flex gap-2">
            <span
              className={`rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide backdrop-blur-sm ${typeBadge.className}`}
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              {typeBadge.label}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-4 p-8">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/shop/products/${product.id}`} className="min-w-0 flex-1 pr-4">
            <h3
              className="truncate text-2xl font-bold leading-8 text-zinc-800"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              {product.name}
            </h3>
          </Link>
          <span
            className="shrink-0 text-base font-bold text-red-700"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {formatFromPrice(startingPriceNgn)}
          </span>
        </div>

        {product.description ? (
          <p className="text-sm leading-5 text-stone-600" style={{ fontFamily: "var(--font-inter)" }}>
            {product.description}
          </p>
        ) : null}

        <AddToOrderButton productId={product.id} />
      </div>
    </div>
  );
}
