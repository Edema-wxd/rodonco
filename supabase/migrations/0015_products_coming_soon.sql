-- Add coming_soon to products — marks a product as a teaser: it stays on the
-- shop (still active) but its image is blurred, it carries a "Coming Soon"
-- label, and it cannot be added to an order.
-- Defaults to false so every existing product is unchanged.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false;
