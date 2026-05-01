-- 0001_initial_schema.sql
-- All 6 tables for Rodo & Co. RLS enabled per D-03.

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  type        TEXT        NOT NULL CHECK (type IN ('fresh_produce', 'cooking_kit')),
  image_url   TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_active_products"
  ON products FOR SELECT TO anon
  USING (is_active = true);

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
CREATE TABLE product_variants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  price_ngn   INTEGER     NOT NULL,
  is_default  BOOLEAN     NOT NULL DEFAULT false
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_variants"
  ON product_variants FOR SELECT TO anon
  USING (true);

-- ============================================================
-- PRODUCT PREP OPTIONS
-- ============================================================
CREATE TABLE product_prep_options (
  id             UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label          TEXT     NOT NULL,
  extra_cost_ngn INTEGER  NOT NULL DEFAULT 0
);

ALTER TABLE product_prep_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_prep_options"
  ON product_prep_options FOR SELECT TO anon
  USING (true);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        TEXT        UNIQUE NOT NULL,
  customer_name    TEXT        NOT NULL,
  customer_email   TEXT        NOT NULL,
  customer_phone   TEXT        NOT NULL,
  delivery_address TEXT        NOT NULL,
  allergy_notes    TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'paid', 'processing', 'delivered', 'cancelled')),
  total_ngn        INTEGER     NOT NULL,
  week_of          DATE        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at      TIMESTAMPTZ
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- No anon policy: all order access via service_role (bypasses RLS)

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID    NOT NULL REFERENCES products(id),
  product_name   TEXT    NOT NULL,
  variant_label  TEXT,
  prep_option    TEXT,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_ngn INTEGER NOT NULL,
  subtotal_ngn   INTEGER NOT NULL
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- No anon policy: all order_items access via service_role

-- ============================================================
-- ORDERING CONFIG (single-row table — id always 1)
-- ============================================================
CREATE TABLE ordering_config (
  id                  INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_ordering_open    BOOLEAN     NOT NULL DEFAULT true,
  cutoff_message      TEXT,
  next_delivery_date  DATE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ordering_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_ordering_config"
  ON ordering_config FOR SELECT TO anon
  USING (true);
