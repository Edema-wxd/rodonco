"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCartStore } from "@/store/cart";
import type { CartItem } from "@/types";

function formatNgn(naira: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(naira);
}

interface Props {
  items: CartItem[];
  deliveryFeeNgn: number | null;
  /** When false, the summary is read-only (no quantity/remove controls). Defaults to true. */
  editable?: boolean;
}

export function CheckoutCartSummary({ items, deliveryFeeNgn, editable = true }: Props) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  // All amounts are in NGN (subtotalNgn, deliveryFeeNgn) — no kobo conversion.
  const subtotal = items.reduce((sum, item) => sum + item.subtotalNgn, 0);
  const total = deliveryFeeNgn !== null ? subtotal + deliveryFeeNgn : null;

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <h2 className="text-base font-semibold">Your Order</h2>
        {editable && (
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Add more items
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3" aria-label="Order items">
          {items.map((item, idx) => {
            const key = `${item.productId}-${item.variantLabel ?? ""}-${item.prepOption ?? ""}-${idx}`;
            return (
              <li key={key} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-sm leading-snug">
                    {item.productName}
                    {item.variantLabel && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {item.variantLabel}
                      </span>
                    )}
                    {!editable && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        &times;&nbsp;{item.quantity}
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium tabular-nums whitespace-nowrap text-accent">
                    {formatNgn(item.subtotalNgn)}
                  </span>
                </div>

                {item.prepOption && (
                  <p className="text-xs text-muted-foreground">{item.prepOption}</p>
                )}

                {editable && (
                  <div className="mt-0.5 flex items-center justify-between">
                    {/* Quantity stepper */}
                    <div className="inline-flex items-center rounded-lg border">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-l-lg text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantLabel,
                            item.quantity - 1,
                            item.prepOption
                          )
                        }
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.productName}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 px-1 text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-r-lg text-foreground transition-colors hover:bg-secondary"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantLabel,
                            item.quantity + 1,
                            item.prepOption
                          )
                        }
                        aria-label={`Increase quantity of ${item.productName}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-destructive"
                      onClick={() =>
                        removeItem(item.productId, item.variantLabel, item.prepOption)
                      }
                      aria-label={`Remove ${item.productName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="border-t" aria-hidden />

        {/* Subtotal + Delivery + Total */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatNgn(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Delivery</span>
            <span className="tabular-nums">
              {deliveryFeeNgn === null
                ? "Select area"
                : deliveryFeeNgn === 0
                ? "Free"
                : formatNgn(deliveryFeeNgn)}
            </span>
          </div>
          <div className="flex justify-between items-baseline border-t pt-2">
            <span className="text-base font-semibold">Total</span>
            <span className="font-heading text-2xl tabular-nums">
              {total !== null ? formatNgn(total) : "—"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
