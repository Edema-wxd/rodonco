"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CartItem } from "@/types";

function formatNgn(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

interface Props {
  items: CartItem[];
}

export function CheckoutCartSummary({ items }: Props) {
  const total = items.reduce((sum, item) => sum + item.subtotalNgn, 0);

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">Your Order</h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3" aria-label="Order items">
          {items.map((item, idx) => {
            const key = `${item.productId}-${item.variantLabel ?? ""}-${item.prepOption ?? ""}-${idx}`;
            return (
              <li key={key} className="flex flex-col gap-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-sm leading-snug">
                    {item.productName}
                    {item.variantLabel && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {item.variantLabel}
                      </span>
                    )}
                    <span className="ml-1 text-xs text-muted-foreground">
                      &times;&nbsp;{item.quantity}
                    </span>
                  </span>
                  <span className="text-sm font-medium tabular-nums whitespace-nowrap text-accent">
                    {formatNgn(item.subtotalNgn)}
                  </span>
                </div>
                {item.prepOption && (
                  <p className="text-xs text-muted-foreground">{item.prepOption}</p>
                )}
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="border-t" aria-hidden />

        {/* Total */}
        <div className="flex justify-between items-baseline">
          <span className="text-base font-semibold">Total</span>
          <span className="font-heading text-2xl tabular-nums">
            {formatNgn(total)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Free delivery every Saturday
        </p>
      </CardContent>
    </Card>
  );
}
