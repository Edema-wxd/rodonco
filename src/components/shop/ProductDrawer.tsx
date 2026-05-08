"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { OrderingClosedBanner } from "@/components/shop/OrderingClosedBanner";
import { useCartStore } from "@/store/cart";
import { useCartUiStore } from "@/store/cartUi";
import type { PrepOption, Product, ProductVariant } from "@/types";

export type ProductDrawerProps = {
  product: Product;
  variants: ProductVariant[];
  prepOptions: PrepOption[];
  isOrderingOpen: boolean;
  cutoffMessage?: string | null;
  nextDeliveryDate?: string | null;
  onRequestClose?: () => void;
};

function formatNgn(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function getCheapestVariantPriceKobo(variants: ProductVariant[]): number {
  if (!variants.length) return 0;
  return variants.reduce((min, v) => (v.price_ngn < min ? v.price_ngn : min), variants[0].price_ngn);
}

export function ProductDrawer({
  product,
  variants,
  prepOptions,
  isOrderingOpen,
  cutoffMessage,
  nextDeliveryDate,
  onRequestClose,
}: ProductDrawerProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const autoOpenOnFirstAdd = useCartUiStore((s) => s.autoOpenOnFirstAdd);
  const [isOpen, setIsOpen] = useState(true);

  const isKit = product.type === "cooking_kit";
  const isProduce = product.type === "fresh_produce";

  const needsVariant = isKit && variants.length > 0;
  const needsPrep = isProduce && prepOptions.length > 0;

  // D-07: no defaults.
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedPrepId, setSelectedPrepId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const selectedVariant = useMemo(
    () => (selectedVariantId ? variants.find((v) => v.id === selectedVariantId) ?? null : null),
    [selectedVariantId, variants]
  );
  const selectedPrep = useMemo(
    () => (selectedPrepId ? prepOptions.find((p) => p.id === selectedPrepId) ?? null : null),
    [selectedPrepId, prepOptions]
  );

  const baseProducePriceKobo = useMemo(() => getCheapestVariantPriceKobo(variants), [variants]);

  const unitPriceKobo = useMemo(() => {
    if (isKit) return selectedVariant?.price_ngn ?? 0;
    const extra = selectedPrep?.extra_cost_ngn ?? 0;
    return baseProducePriceKobo + extra;
  }, [isKit, baseProducePriceKobo, selectedVariant, selectedPrep]);

  const subtotalKobo = useMemo(() => unitPriceKobo * quantity, [unitPriceKobo, quantity]);

  const selectionSatisfied = (!needsVariant || !!selectedVariant) && (!needsPrep || !!selectedPrep);
  const canAddToCart = isOrderingOpen && selectionSatisfied && quantity >= 1 && unitPriceKobo > 0;

  const close = () => {
    // Trigger exit animation before navigating back (route change unmounts immediately otherwise).
    setIsOpen(false);
    window.setTimeout(() => {
      if (onRequestClose) return onRequestClose();
      router.back();
    }, 220);
  };

  const onAddToCart = () => {
    if (!canAddToCart) return;

    const variantLabel = isKit ? selectedVariant?.label ?? null : null;
    const prepOption = isProduce ? selectedPrep?.label ?? null : null;

    addItem({
      productId: product.id,
      productName: product.name,
      variantLabel,
      prepOption,
      quantity,
      unitPriceNgn: unitPriceKobo,
      subtotalNgn: subtotalKobo,
    });

    autoOpenOnFirstAdd();
    close();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen ? (
        <div className="fixed inset-0 z-[70]">
          <motion.button
            type="button"
            aria-label="Close product drawer"
            className="absolute inset-0 bg-black/40"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ willChange: "opacity" }}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            className={[
              "absolute bottom-0 left-0 right-0 flex max-h-[92vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl",
              "sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[520px] sm:rounded-none",
            ].join(" ")}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.05}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 800) close();
            }}
            style={{ willChange: "transform, opacity" }}
          >
          <div className="flex items-start justify-between gap-4 border-b px-4 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-black/60">Product</p>
              <h2 className="truncate text-base font-semibold text-black">{product.name}</h2>
              {product.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-black/70">{product.description}</p>
              ) : null}
            </div>

            <Link
              href="/shop"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>

          <OrderingClosedBanner
            isOpen={isOrderingOpen}
            cutoffMessage={cutoffMessage}
            nextDeliveryDate={nextDeliveryDate}
          />

          <div className="flex-1 overflow-auto px-4 py-4">
            <div className="space-y-6">
              {isKit ? (
                <section>
                  <h3 className="text-sm font-semibold text-black">Choose a size</h3>
                  {variants.length === 0 ? (
                    <p className="mt-2 text-sm text-black/70">No sizes available for this kit.</p>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {variants.map((v) => {
                        const active = v.id === selectedVariantId;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariantId(v.id)}
                            className={[
                              "rounded-xl border px-3 py-2 text-left text-sm font-semibold",
                              active
                                ? "border-black bg-black text-white"
                                : "border-gray-200 bg-white text-black",
                            ].join(" ")}
                          >
                            <span className="block">{v.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {needsVariant && !selectedVariant ? (
                    <p className="mt-2 text-xs font-medium text-black/60">
                      Select a size to enable Add to cart.
                    </p>
                  ) : null}
                </section>
              ) : (
                <section>
                  <h3 className="text-sm font-semibold text-black">Choose a prep option</h3>
                  {prepOptions.length === 0 ? (
                    <p className="mt-2 text-sm text-black/70">No prep options for this item.</p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {prepOptions.map((p) => {
                        const active = p.id === selectedPrepId;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPrepId(p.id)}
                            className={[
                              "rounded-xl border px-3 py-2 text-left text-sm font-semibold",
                              active
                                ? "border-black bg-black text-white"
                                : "border-gray-200 bg-white text-black",
                            ].join(" ")}
                          >
                            <span className="block">{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {needsPrep && !selectedPrep ? (
                    <p className="mt-2 text-xs font-medium text-black/60">
                      Select a prep option to enable Add to cart.
                    </p>
                  ) : null}
                </section>
              )}

              <section className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-black">Quantity</p>
                  <div className="inline-flex items-center rounded-lg border bg-white">
                    <button
                      type="button"
                      className="h-10 w-10 rounded-l-lg text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-10 px-2 text-center text-sm font-semibold text-black">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className="h-10 w-10 rounded-r-lg text-sm font-semibold text-black"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {quantity > 20 ? (
                  <p className="mt-2 text-xs font-medium text-black/60">
                    Large quantity — we’ll do our best to fulfill, but availability may vary.
                  </p>
                ) : null}
              </section>

              <section className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-black">Subtotal</p>
                  <p className="text-sm font-semibold text-black">{formatNgn(subtotalKobo)}</p>
                </div>
                <p className="mt-1 text-xs text-black/60">Subtotal only (unit price is implied).</p>
              </section>
            </div>
          </div>

          <div className="border-t px-4 py-4">
            <button
              type="button"
              className={[
                "w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold sm:py-3.5",
                canAddToCart ? "bg-black text-white hover:bg-black/90" : "bg-gray-100 text-gray-500",
              ].join(" ")}
              onClick={onAddToCart}
              disabled={!canAddToCart}
              title={
                !isOrderingOpen
                  ? "Ordering is closed"
                  : !selectionSatisfied
                    ? "Select the required option to add to cart"
                    : unitPriceKobo <= 0
                      ? "Price unavailable"
                      : undefined
              }
            >
              {!isOrderingOpen ? "Ordering closed" : "Add to cart"}
            </button>

            {!isOrderingOpen ? (
              <p className="mt-2 text-center text-xs text-black/60">
                Ordering is closed — you can still browse, but you can’t add items right now.
              </p>
            ) : null}
          </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

