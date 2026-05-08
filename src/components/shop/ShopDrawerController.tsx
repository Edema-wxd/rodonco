"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ProductDrawer } from "@/components/shop/ProductDrawer";
import type { OrderingConfig } from "@/lib/shop/orderingConfig";
import type { PrepOption, Product, ProductVariant } from "@/types";

type DrawerPayload = {
  ordering: OrderingConfig;
  product: Product;
  variants: ProductVariant[];
  prepOptions: PrepOption[];
};

export function ShopDrawerController() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const drawerId = searchParams.get("drawer");

  const [data, setData] = useState<DrawerPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const shouldRender = !!drawerId;

  const close = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("drawer");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const url = useMemo(() => {
    if (!drawerId) return null;
    return `/api/shop/product/${encodeURIComponent(drawerId)}`;
  }, [drawerId]);

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setData(null);

    fetch(url, { method: "GET" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch drawer product: ${res.status}`);
        return (await res.json()) as DrawerPayload;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
      })
      .catch(() => {
        if (cancelled) return;
        // If the product doesn't exist, just close the drawer param to avoid trapping the user.
        close();
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (!shouldRender) return null;

  // Lightweight client-side loading shell while the API returns the data.
  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-[70]">
        <button
          type="button"
          aria-label="Close product drawer"
          className="absolute inset-0 bg-black/40"
          onClick={close}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Loading product"
          className={[
            "absolute bottom-0 left-0 right-0 flex max-h-[92vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl",
            "sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[520px] sm:rounded-none",
          ].join(" ")}
        >
          <div className="border-b px-4 py-4">
            <div className="h-3 w-20 rounded bg-stone-200" />
            <div className="mt-2 h-5 w-56 rounded bg-stone-200" />
            <div className="mt-2 h-4 w-80 max-w-full rounded bg-stone-100" />
          </div>
          <div className="flex-1 overflow-auto px-4 py-4">
            <div className="space-y-4">
              <div className="h-4 w-40 rounded bg-stone-100" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 rounded-xl bg-stone-100" />
                <div className="h-10 rounded-xl bg-stone-100" />
              </div>
              <div className="h-24 rounded-2xl border bg-white p-4">
                <div className="h-4 w-24 rounded bg-stone-100" />
                <div className="mt-3 h-10 w-40 rounded-lg bg-stone-100" />
              </div>
              <div className="h-20 rounded-2xl border bg-white p-4">
                <div className="h-4 w-24 rounded bg-stone-100" />
                <div className="mt-3 h-4 w-32 rounded bg-stone-100" />
              </div>
            </div>
          </div>
          <div className="border-t px-4 py-4">
            <div className="h-12 w-full rounded-2xl bg-stone-100" />
          </div>
        </aside>
      </div>
    );
  }

  return (
    <ProductDrawer
      product={data.product}
      variants={data.variants}
      prepOptions={data.prepOptions}
      isOrderingOpen={data.ordering.is_ordering_open}
      cutoffMessage={data.ordering.cutoff_message}
      nextDeliveryDate={data.ordering.next_delivery_date}
      onRequestClose={close}
    />
  );
}

