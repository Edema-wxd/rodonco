-- Migration: 0016_homepage_menu_preview
-- Admin-editable content for the homepage "Ready for the Pot." section.
-- Single-row table (id always 1). product_ids is an ordered JSON array of
-- product UUIDs; an empty array means "show the first 3 active cooking kits".
CREATE TABLE IF NOT EXISTS homepage_menu_preview (
  id                INTEGER PRIMARY KEY DEFAULT 1,
  is_visible        BOOLEAN NOT NULL DEFAULT TRUE,
  heading           TEXT NOT NULL DEFAULT 'Ready for the',
  heading_accent    TEXT NOT NULL DEFAULT 'Pot.',
  subheading        TEXT NOT NULL DEFAULT 'Check out our curated kits, prepped to make cooking easier.',
  card_button_label TEXT NOT NULL DEFAULT 'Add to Box',
  cta_label         TEXT NOT NULL DEFAULT 'View All Products',
  cta_href          TEXT NOT NULL DEFAULT '/shop',
  product_ids       JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT homepage_menu_preview_single_row CHECK (id = 1)
);

INSERT INTO homepage_menu_preview (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
