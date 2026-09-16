// Shared (client + server) types and helpers for the homepage
// "Ready for the Pot." section. No DB access here — see menuPreview.ts.

export const MENU_PREVIEW_MAX_PRODUCTS = 6;
export const MENU_PREVIEW_FALLBACK_COUNT = 3;

export type MenuPreviewConfig = {
  is_visible: boolean;
  heading: string;
  heading_accent: string;
  subheading: string;
  card_button_label: string;
  cta_label: string;
  cta_href: string;
  /** Ordered product UUIDs. Empty = first active cooking kits. */
  product_ids: string[];
};

export const DEFAULT_MENU_PREVIEW_CONFIG: MenuPreviewConfig = {
  is_visible: true,
  heading: "Ready for the",
  heading_accent: "Pot.",
  subheading: "Check out our curated kits, prepped to make cooking easier.",
  card_button_label: "Add to Box",
  cta_label: "View All Products",
  cta_href: "/shop",
  product_ids: [],
};

/**
 * Picks the products to show. With a curated list, keeps the admin's order and
 * silently drops anything no longer active (not in `products`). Without one —
 * or when every curated product has gone inactive — falls back to the first
 * active cooking kits so the section never renders empty by accident.
 */
export function selectMenuPreviewProducts<T extends { id: string; type: string }>(
  products: T[],
  productIds: string[],
): T[] {
  if (productIds.length > 0) {
    const byId = new Map(products.map((p) => [p.id, p]));
    const curated = productIds
      .map((id) => byId.get(id))
      .filter((p): p is T => p !== undefined)
      .slice(0, MENU_PREVIEW_MAX_PRODUCTS);
    if (curated.length > 0) return curated;
  }

  return products.filter((p) => p.type === "cooking_kit").slice(0, MENU_PREVIEW_FALLBACK_COUNT);
}
