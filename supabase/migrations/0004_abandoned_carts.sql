-- 0004_abandoned_carts.sql
-- Capture customer info + cart at checkout step 1 for abandoned cart recovery.

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  allergy_notes   TEXT,
  cart_items      JSONB NOT NULL,
  subtotal_ngn    INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contacted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS abandoned_carts_email_idx ON abandoned_carts (customer_email);
CREATE INDEX IF NOT EXISTS abandoned_carts_created_at_idx ON abandoned_carts (created_at DESC);
