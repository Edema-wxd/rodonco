import "server-only";

import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db, schema } from "@/lib/db";
import { DEFAULT_MENU_PREVIEW_CONFIG, type MenuPreviewConfig } from "@/lib/homepage/menuPreviewShared";

export const MENU_PREVIEW_CACHE_TAG = "homepage-menu-preview";

export async function getMenuPreviewConfig(): Promise<MenuPreviewConfig> {
  const [row] = await db
    .select()
    .from(schema.homepage_menu_preview)
    .where(eq(schema.homepage_menu_preview.id, 1))
    .limit(1);

  if (!row) return DEFAULT_MENU_PREVIEW_CONFIG;

  return {
    is_visible: row.is_visible,
    heading: row.heading,
    heading_accent: row.heading_accent,
    subheading: row.subheading,
    card_button_label: row.card_button_label,
    cta_label: row.cta_label,
    cta_href: row.cta_href,
    product_ids: Array.isArray(row.product_ids)
      ? (row.product_ids as unknown[]).filter((v): v is string => typeof v === "string")
      : [],
  };
}

/**
 * Homepage read path. Falls back to defaults if the query fails (e.g. the
 * 0016 migration hasn't been applied yet) so the homepage never 500s over
 * editable copy.
 */
export async function getCachedMenuPreviewConfig(): Promise<MenuPreviewConfig> {
  try {
    return await unstable_cache(getMenuPreviewConfig, ["homepage-menu-preview-v1"], {
      tags: [MENU_PREVIEW_CACHE_TAG],
    })();
  } catch (err) {
    console.error("[getCachedMenuPreviewConfig] Falling back to defaults:", err);
    return DEFAULT_MENU_PREVIEW_CONFIG;
  }
}
