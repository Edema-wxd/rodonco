import Link from "next/link";

import { ProductImageCarousel } from "@/components/shop/ProductImageCarousel";
import { getOrderingConfig } from "@/lib/shop/orderingConfig";
import { getProductDetailsById } from "@/lib/shop/productDetails";

export const revalidate = 60;

function formatNgn(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ordering, details] = await Promise.all([getOrderingConfig(), getProductDetailsById(id)]);

  if (!details) {
    return (
      <div className="bg-stone-100 py-24">
        <div className="mx-auto max-w-7xl px-8">
          <h1 className="text-3xl font-black text-zinc-800" style={{ fontFamily: "var(--font-quicksand)" }}>
            Product not found
          </h1>
          <p className="mt-3 text-stone-600" style={{ fontFamily: "var(--font-inter)" }}>
            This product doesn’t exist (or is no longer available).
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-full bg-red-600 px-8 py-3 text-sm font-bold text-rose-50 hover:opacity-90"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const hasChoices = details.variants.length > 0 || details.prepOptions.length > 0;

  return (
    <div className="bg-stone-100 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-8">
          <Link
            href="/shop"
            className="text-sm font-black uppercase tracking-wider text-red-700"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            ← Back to menu
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="overflow-hidden rounded-[32px] bg-white outline outline-1 outline-stone-200/50">
            <ProductImageCarousel
              images={details.product.images}
              alt={details.product.name}
              className="h-[420px] w-full"
            />
          </div>

          <div>
            <h1 className="text-5xl font-black text-zinc-800" style={{ fontFamily: "var(--font-quicksand)" }}>
              {details.product.name}
            </h1>

            {details.product.description ? (
              <p className="mt-4 text-base leading-7 text-stone-600" style={{ fontFamily: "var(--font-inter)" }}>
                {details.product.description}
              </p>
            ) : null}

            <div className="mt-8 rounded-[32px] bg-white p-8 outline outline-1 outline-stone-200/50">
              <p className="text-xs font-black uppercase tracking-wider text-stone-500" style={{ fontFamily: "var(--font-quicksand)" }}>
                Ordering
              </p>
              <p className="mt-2 text-sm text-stone-600" style={{ fontFamily: "var(--font-inter)" }}>
                {ordering.is_ordering_open ? "Open now" : "Closed right now"}.
              </p>

              <div className="mt-6">
                <Link
                  href={`/shop?drawer=${encodeURIComponent(details.product.id)}`}
                  className="inline-flex w-full items-center justify-center rounded-full bg-stone-100 py-4 text-base font-bold text-zinc-800 transition-colors hover:bg-stone-200"
                  style={{ fontFamily: "var(--font-quicksand)" }}
                >
                  {hasChoices ? "Choose options & add to order" : "Add to order"}
                </Link>
                <p className="mt-2 text-xs text-stone-600" style={{ fontFamily: "var(--font-inter)" }}>
                  Opens the sidebar to select quantity and options.
                </p>
              </div>
            </div>

            {(details.variants.length > 0 || details.prepOptions.length > 0) && (
              <div className="mt-10 space-y-6">
                {details.variants.length > 0 ? (
                  <section>
                    <h2 className="text-sm font-black uppercase tracking-wider text-zinc-800" style={{ fontFamily: "var(--font-quicksand)" }}>
                      Sizes
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {details.variants.map((v) => (
                        <li
                          key={v.id}
                          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 outline outline-1 outline-stone-200/50"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          <span className="text-sm font-semibold text-zinc-800">{v.label}</span>
                          <span className="text-sm font-bold text-red-700">{formatNgn(v.price_ngn)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {details.prepOptions.length > 0 ? (
                  <section>
                    <h2 className="text-sm font-black uppercase tracking-wider text-zinc-800" style={{ fontFamily: "var(--font-quicksand)" }}>
                      Prep options
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {details.prepOptions.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 outline outline-1 outline-stone-200/50"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          <span className="text-sm font-semibold text-zinc-800">{p.label}</span>
                          <span className="text-sm font-bold text-green-800">
                            {p.extra_cost_ngn > 0 ? `+${formatNgn(p.extra_cost_ngn)}` : "Included"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

