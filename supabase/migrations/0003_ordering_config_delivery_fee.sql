-- 0003_ordering_config_delivery_fee.sql
-- Add delivery fee configuration to the ordering config table.

ALTER TABLE ordering_config
  ADD COLUMN IF NOT EXISTS delivery_fee_ngn INTEGER NOT NULL DEFAULT 0;
