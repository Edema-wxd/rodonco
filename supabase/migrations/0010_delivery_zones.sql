-- Migration: 0010_delivery_zones
-- Adds a delivery_zones column to ordering_config to support per-area delivery pricing.
-- Each zone is { area: string, fee_ngn: number }. Defaults to empty array.

ALTER TABLE ordering_config
  ADD COLUMN IF NOT EXISTS delivery_zones jsonb NOT NULL DEFAULT '[]'::jsonb;
