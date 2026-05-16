"use client";

import { X } from "lucide-react";
import { useMemo } from "react";
import { OrderingClosedBanner } from "@/components/shop/OrderingClosedBanner";
import { useCartStore } from "@/store/cart";
import { useCartUiStore } from "@/store/cartUi";

export type CartSidebarProps = {
  isOrderingOpen: boolean;
  cutoffMessage?: string | null;
  nextDeliveryDate?: string | null;
};

function formatNgn(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}

export function CartSidebar({
  isOrderingOpen,
  cutoffMessage,
  nextDeliveryDate,
}: CartSidebarProps) {
  const isOpen = useCartUiStore((s) => s.isOpen);
  const closeCart = useCartUiStore((s) => s.closeCart);

  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const subtotalKobo = useMemo(
    () => items.reduce((sum, i) => sum + i.subtotalNgn, 0),
    [items]
  );

  const isViewOnly = !isOrderingOpen;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/40"
        onClick={closeCart}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        className={[
          "absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl",
          "sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-none",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div>
            <p className="font-heading text-lg italic text-foreground">Your cart</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{items.length} item(s)</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary transition-colors"
            onClick={closeCart}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <OrderingClosedBanner
          isOpen={isOrderingOpen}
          cutoffMessage={cutoffMessage}
          nextDeliveryDate={nextDeliveryDate}
        />

        <div className="flex-1 overflow-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="rounded-xl border bg-white p-4">
              <p className="text-sm font-medium text-black">Let&apos;s fix your next meal together.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const secondaryParts = [
                  item.variantLabel ? `Size: ${item.variantLabel}` : null,
                  item.prepOption ? `Prep: ${item.prepOption}` : null,
                ].filter(Boolean);

                return (
                  <li key={`${item.productId}:${item.variantLabel ?? ""}:${item.prepOption ?? ""}`}>
                    <div className="rounded-xl border bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-black">
                            {item.productName}
                          </p>
                          {secondaryParts.length ? (
                            <p className="mt-1 text-xs text-black/60">
                              {secondaryParts.join(" • ")}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-black">
                          {formatNgn(item.subtotalNgn)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg border bg-white">
                          <button
                            type="button"
                            className="h-9 w-10 rounded-l-lg text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variantLabel,
                                item.quantity - 1,
                                item.prepOption
                              )
                            }
                            disabled={isViewOnly || item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="min-w-10 px-2 text-center text-sm font-semibold text-black">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="h-9 w-10 rounded-r-lg text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variantLabel,
                                item.quantity + 1,
                                item.prepOption
                              )
                            }
                            disabled={isViewOnly}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="text-sm font-medium text-black/70 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() =>
                            removeItem(item.productId, item.variantLabel, item.prepOption)
                          }
                          disabled={isViewOnly}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-black">Subtotal</p>
            <p className="text-sm font-semibold text-black">{formatNgn(subtotalKobo)}</p>
          </div>
          <p className="mt-1 text-xs text-black/60">Free delivery on Saturdays</p>
        </div>
      </aside>
    </div>
  );
}

