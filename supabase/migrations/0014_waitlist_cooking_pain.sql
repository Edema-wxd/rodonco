-- Migration: 0014_waitlist_cooking_pain
-- Adds the open-ended waitlist question:
--   "What's the part of cooking you hate most?" (optional, nullable).
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS cooking_pain text;
