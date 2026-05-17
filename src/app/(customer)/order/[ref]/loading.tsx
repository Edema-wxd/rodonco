export default function OrderConfirmationLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Branded loading message */}
      <p
        className="mb-8 text-sm font-medium text-stone-500"
        style={{ fontFamily: "var(--font-lexend)" }}
      >
        Your kitchen assistant is on it.
      </p>

      {/* Header skeleton */}
      <div className="mb-8 flex items-center gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-stone-200 animate-pulse" />
        <div className="h-7 w-44 rounded-lg bg-stone-200 animate-pulse" />
      </div>

      {/* Greeting skeleton */}
      <div className="mb-6 h-5 w-3/4 rounded bg-stone-100 animate-pulse" />

      {/* Card skeleton */}
      <div className="rounded-xl border bg-white shadow-sm">
        {/* Card header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-28 rounded bg-stone-100 animate-pulse" />
            <div className="h-5 w-32 rounded-full border bg-stone-100 animate-pulse" />
          </div>
        </div>

        {/* Card content */}
        <div className="space-y-6 px-6 py-6">
          {/* Delivery details */}
          <div className="rounded-md border p-4 space-y-2">
            <div className="h-4 w-24 rounded bg-stone-200 animate-pulse" />
            <div className="h-4 w-56 rounded bg-stone-100 animate-pulse" />
            <div className="mt-1 h-4 w-40 rounded bg-stone-200 animate-pulse" />
          </div>

          {/* Line items */}
          <div>
            <div className="mb-3 h-5 w-24 rounded bg-stone-200 animate-pulse" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-48 rounded bg-stone-100 animate-pulse" />
                    <div className="h-3 w-24 rounded bg-stone-100 animate-pulse" />
                  </div>
                  <div className="h-4 w-16 rounded bg-stone-100 animate-pulse" />
                </div>
              ))}
            </div>
            {/* Total */}
            <div className="mt-4 border-t pt-4 flex justify-between items-center">
              <div className="h-5 w-12 rounded bg-stone-200 animate-pulse" />
              <div className="h-8 w-24 rounded-lg bg-stone-200 animate-pulse" />
            </div>
          </div>

          {/* CTA skeleton */}
          <div className="pt-2">
            <div className="h-10 w-44 rounded-lg bg-stone-100 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
