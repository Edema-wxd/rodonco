"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { OrderingClosedBanner } from "@/components/shop/OrderingClosedBanner";
import { SideDrawer } from "@/components/ui/SideDrawer";
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
  /** Skip the slide-in entrance animation (e.g. when a skeleton was already in place). */
  skipEnterAnimation?: boolean;
};

function formatNgn(naira: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
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
  skipEnterAnimation = false,
}: ProductDrawerProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartUiStore((s) => s.openCart);
  const isKit = product.type === "cooking_kit";
  const isProduce = product.type === "fresh_produce";

  const needsVariant = isKit && variants.length > 0;
  const needsPrep = prepOptions.length > 0;

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

  const activeImageUrl = useMemo(() => {
    if (!product.images.length) return null;
    if (isProduce && selectedPrepId) {
      const prepIdx = prepOptions.findIndex((p) => p.id === selectedPrepId);
      const img = product.images[prepIdx];
      return img?.url ?? product.images[0].url;
    }
    return product.images[0].url;
  }, [isProduce, selectedPrepId, prepOptions, product.images]);

  const unitPriceKobo = useMemo(() => {
    const extra = selectedPrep?.extra_cost_ngn ?? 0;
    if (isKit) return (selectedVariant?.price_ngn ?? 0) + extra;
    return baseProducePriceKobo + extra;
  }, [isKit, baseProducePriceKobo, selectedVariant, selectedPrep]);

  const subtotalKobo = useMemo(() => unitPriceKobo * quantity, [unitPriceKobo, quantity]);

  // Teaser products are reachable by a direct ?drawer=<id> link, so the drawer
  // enforces the same rule the card does: preview only, never orderable.
  const comingSoon = product.coming_soon;
  const selectionSatisfied = (!needsVariant || !!selectedVariant) && (!needsPrep || !!selectedPrep);
  const canAddToCart = !comingSoon && selectionSatisfied && quantity >= 1;

  // The cart opens only once this drawer has finished sliding out, so the two
  // panels hand over cleanly instead of overlapping mid-slide.
  const openCartOnClose = useRef(false);

  const handleClosed = () => {
    if (openCartOnClose.current) {
      openCartOnClose.current = false;
      openCart();
    }
    if (onRequestClose) return onRequestClose();
    router.back();
  };

  const onAddToCart = (close: () => void) => {
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

    openCartOnClose.current = true;
    close();
  };

  return (
    <SideDrawer
      label={product.name}
      onClose={handleClosed}
      backdropLabel="Close product"
      skipEnterAnimation={skipEnterAnimation}
    >
      {(close) => (
        <>
          <div className="flex shrink-0 items-start justify-between gap-4 border-b px-4 pb-4 pt-2 sm:pt-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-black/60">
                {comingSoon ? "Coming soon" : "Product"}
              </p>
              <h2 className="truncate text-base font-semibold text-black">{product.name}</h2>
              {product.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-black/70">{product.description}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!comingSoon ? (
            <OrderingClosedBanner
              isOpen={isOrderingOpen}
              cutoffMessage={cutoffMessage}
              nextDeliveryDate={nextDeliveryDate}
            />
          ) : null}

          <div className="flex-1 overflow-auto px-4 py-4">
            <div className="space-y-6">
              {activeImageUrl && (
                <div className="relative h-52 overflow-hidden rounded-2xl bg-stone-100">
                  <AnimatePresence mode="sync">
                    <motion.img
                      key={activeImageUrl}
                      src={activeImageUrl}
                      alt={product.name}
                      loading="lazy"
                      aria-hidden={comingSoon || undefined}
                      className={[
                        "absolute inset-0 h-full w-full object-cover",
                        comingSoon ? "scale-105 blur-md saturate-[0.85]" : "",
                      ].join(" ")}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    />
                  </AnimatePresence>
                  {comingSoon ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/25">
                      <span className="rounded-full bg-zinc-900/85 px-5 py-2 text-xs font-black uppercase tracking-widest text-white backdrop-blur-sm">
                        Coming Soon
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
              {comingSoon ? (
                <p className="text-sm text-black/70">
                  This one isn’t on the menu yet — we’re still prepping it. Check back soon.
                </p>
              ) : null}

              {!comingSoon && isKit ? (
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
              ) : null}

              {!comingSoon && prepOptions.length > 0 ? (
                <section>
                  <h3 className="text-sm font-semibold text-black">Choose a prep option</h3>
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
                  {needsPrep && !selectedPrep ? (
                    <p className="mt-2 text-xs font-medium text-black/60">
                      Select a prep option to enable Add to cart.
                    </p>
                  ) : null}
                </section>
              ) : null}

              {!comingSoon ? (
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
              ) : null}

              {!comingSoon ? (
              <section className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-black">Subtotal</p>
                  <p className="text-sm font-semibold text-black">{formatNgn(subtotalKobo)}</p>
                </div>
                <p className="mt-1 text-xs text-black/60">Subtotal only (unit price is implied).</p>
              </section>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t px-4 py-4">
            <button
              type="button"
              className={[
                "w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold sm:py-3.5",
                canAddToCart ? "bg-black text-white hover:bg-black/90" : "bg-gray-100 text-gray-500",
              ].join(" ")}
              onClick={() => onAddToCart(close)}
              disabled={!canAddToCart}
              title={
                comingSoon
                  ? "This product isn’t available to order yet"
                  : !selectionSatisfied
                    ? "Select the required option to add to cart"
                    : undefined
              }
            >
              {comingSoon ? "Coming soon" : "Add to cart"}
            </button>

            {!isOrderingOpen && !comingSoon ? (
              <p className="mt-2 text-center text-xs text-black/60">
                Ordering is currently closed — items added now will be saved for when ordering reopens.
              </p>
            ) : null}
          </div>
        </>
      )}
    </SideDrawer>
  );
}

