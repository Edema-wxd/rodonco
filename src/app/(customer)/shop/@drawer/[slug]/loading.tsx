import {
  DRAWER_BACKDROP_CLASS,
  DRAWER_ROOT_CLASS,
  drawerPanelClass,
} from "@/components/ui/drawerPanel";

export default function DrawerLoading() {
  return (
    <div className={`${DRAWER_ROOT_CLASS} z-[70]`}>
      <div className={DRAWER_BACKDROP_CLASS} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Loading product"
        className={drawerPanelClass()}
      >
        <div className="shrink-0 border-b px-4 py-4">
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

        <div className="shrink-0 border-t px-4 py-4">
          <div className="h-12 w-full rounded-2xl bg-stone-100" />
        </div>
      </aside>
    </div>
  );
}
