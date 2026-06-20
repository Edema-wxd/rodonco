-- Add delivery_area to orders (nullable — not all orders have a zone-specific area)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_area text;
