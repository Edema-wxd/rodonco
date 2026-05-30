-- Admin performance indexes.
--
-- Background: the admin pages filter orders by status / week_of, join
-- order_items by order_id, and filter abandoned_carts by contacted_at.
-- Without these indexes Postgres performs sequential scans on every
-- admin page load, which grows linearly with table size.
--
-- All indexes use IF NOT EXISTS so the migration is idempotent.

-- orders: pending/paid/processing/delivered filters + sort
CREATE INDEX IF NOT EXISTS orders_status_idx        ON orders (status);
CREATE INDEX IF NOT EXISTS orders_week_of_idx       ON orders (week_of);
CREATE INDEX IF NOT EXISTS orders_created_at_idx    ON orders (created_at DESC);

-- order_items: now filtered by order_id IN (...)
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

-- abandoned_carts: dashboard badge filters by uncontacted
CREATE INDEX IF NOT EXISTS abandoned_carts_contacted_at_idx ON abandoned_carts (contacted_at);
CREATE INDEX IF NOT EXISTS abandoned_carts_created_at_idx   ON abandoned_carts (created_at DESC);

-- product_images: read in sort_order for every product page
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON product_images (product_id);
