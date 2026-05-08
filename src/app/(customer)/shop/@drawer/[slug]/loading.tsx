export default function DrawerLoading() {
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in-0 duration-200" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Loading product"
        className={[
          "absolute bottom-0 left-0 right-0 flex max-h-[92vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl",
          "sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:w-[520px] sm:rounded-none",
          "animate-in slide-in-from-bottom-4 duration-200 sm:slide-in-from-right-4",
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

            <div className="mt-2 h-4 w-40 rounded bg-stone-100" />
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

