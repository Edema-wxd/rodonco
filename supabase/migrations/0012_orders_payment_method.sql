-- Add payment_method to orders — records which gateway created the charge.
-- Defaults to 'paystack' so every existing row is backfilled correctly.
-- Values in use: 'paystack' | 'flutterwave'.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'paystack';
