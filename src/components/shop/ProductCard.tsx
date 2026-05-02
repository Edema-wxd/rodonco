import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

function formatFromPrice(priceNgnKobo: number): string {
  const ngn = Math.floor(priceNgnKobo / 100);
  return `From ₦${ngn.toLocaleString("en-NG")}`;
}

export function ProductCard({
  product,
  startingPriceNgn,
}: {
  product: Product;
  startingPriceNgn: number;
}) {
  const imageSrc = product.image_url ?? "/logo.svg";

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <Link href={`/shop/${product.id}`} scroll={false} className="block overflow-hidden">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="font-heading text-lg leading-snug text-foreground">{product.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{formatFromPrice(startingPriceNgn)}</p>
        </div>
        <Link
          href={`/shop/${product.id}`}
          scroll={false}
          className={cn(buttonVariants({ variant: "default" }), "w-full")}
        >
          Add to Order
        </Link>
      </div>
    </div>
  );
}
