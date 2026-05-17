function SkeletonProductCard() {
  return (
    <div className="overflow-hidden rounded-[32px] bg-white outline outline-1 outline-stone-200/50">
      <div className="h-64 w-full bg-stone-200 animate-pulse" />
      <div className="flex flex-col gap-4 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="h-7 w-3/4 rounded-lg bg-stone-200 animate-pulse" />
          <div className="h-5 w-16 rounded-lg bg-stone-100 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-stone-100 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-stone-100 animate-pulse" />
        </div>
        <div className="h-12 w-full rounded-full bg-stone-100 animate-pulse" />
      </div>
    </div>
  );
}

export default function ShopLoading() {
  return (
    <section className="bg-stone-100 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-8">
        {/* Header skeleton */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mx-auto h-6 w-44 rounded-full bg-green-200 animate-pulse" />
          <div className="mx-auto mt-6 h-14 w-3/4 rounded-xl bg-stone-200 animate-pulse" />
          <div className="mx-auto mt-4 h-5 w-2/3 rounded bg-stone-200 animate-pulse" />
        </div>

        <div className="flex gap-12 lg:gap-16">
          {/* Sidebar skeleton (desktop only) */}
          <aside className="hidden lg:flex w-44 shrink-0 flex-col">
            <div className="sticky top-28 flex flex-col gap-3">
              <div className="h-3 w-12 rounded bg-stone-200 animate-pulse" />
              <div className="h-9 w-full rounded-lg bg-white animate-pulse" />
              <div className="h-9 w-full rounded-lg bg-stone-100 animate-pulse" />
            </div>
          </aside>

          {/* Main content skeleton */}
          <div className="min-w-0 flex-1">
            {/* Search bar skeleton */}
            <div className="mb-8 h-12 w-full rounded-full bg-white outline outline-1 outline-stone-200 animate-pulse" />

            {/* Fresh Produce section */}
            <div className="mb-20">
              <div className="pb-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="h-10 w-52 rounded-lg bg-stone-200 animate-pulse" />
                    <div className="mt-2 h-4 w-16 rounded bg-stone-100 animate-pulse" />
                  </div>
                  {/* Category filter pills skeleton */}
                  <div className="flex gap-2">
                    {[80, 100, 120, 100].map((w, i) => (
                      <div
                        key={i}
                        className="h-7 rounded-full bg-stone-200 animate-pulse"
                        style={{ width: `${w}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonProductCard key={i} />
                ))}
              </div>
            </div>

            {/* Cooking Kits section */}
            <div>
              <div className="pb-6">
                <div className="h-10 w-48 rounded-lg bg-stone-200 animate-pulse" />
                <div className="mt-2 h-4 w-16 rounded bg-stone-100 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonProductCard key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
