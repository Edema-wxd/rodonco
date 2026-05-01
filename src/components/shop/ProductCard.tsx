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
    <div className="overflow-hidden rounded-xl bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/shop/${product.id}`} scroll={false} className="block">
        <div className="aspect-[4/3] w-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-xl font-bold">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{formatFromPrice(startingPriceNgn)}</p>
        <Link
          href={`/shop/${product.id}`}
          scroll={false}
          className={cn(buttonVariants({ variant: "default", className: "w-full" }))}
        >
          Add to Order
        </Link>
      </div>
    </div>
  );
}

