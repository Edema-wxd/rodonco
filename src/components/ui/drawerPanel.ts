/**
 * Shared geometry for the app's side drawers (product pop-up, cart).
 *
 * Every drawer — server-rendered skeletons included — builds its panel from
 * these strings, so the pop-up sits in exactly one place per breakpoint:
 * a bottom sheet under 640px, a right-hand panel above it. The slide-in
 * motion lives in `globals.css` under `.drawer-panel`, driven by CSS media
 * queries rather than JS state.
 */

export const DRAWER_ROOT_CLASS = "fixed inset-0";

export const DRAWER_BACKDROP_CLASS =
  "drawer-backdrop absolute inset-0 bg-zinc-900/45";

/** Desktop width. Overridable per drawer, but stay in this shape. */
export const DRAWER_WIDTH_CLASS = "sm:w-[520px] sm:max-w-[calc(100vw-2.5rem)]";

const DRAWER_PANEL_BASE_CLASS = [
  // Mobile: bottom sheet, capped so the page stays visible behind it.
  "drawer-panel absolute bottom-0 left-0 right-0 flex max-h-[92dvh] flex-col overflow-hidden",
  "rounded-t-[28px] bg-card shadow-[0_-8px_40px_-12px_rgb(28_25_23/0.35)]",
  // Desktop: full-height panel pinned to the right edge.
  "sm:bottom-0 sm:left-auto sm:right-0 sm:top-0 sm:max-h-none",
  "sm:rounded-t-none sm:rounded-l-[28px] sm:shadow-[-8px_0_40px_-12px_rgb(28_25_23/0.35)]",
].join(" ");

export function drawerPanelClass(widthClass: string = DRAWER_WIDTH_CLASS): string {
  return `${DRAWER_PANEL_BASE_CLASS} ${widthClass}`;
}

/** Duration of the close transition in `globals.css`, in ms. */
export const DRAWER_CLOSE_MS = 220;
