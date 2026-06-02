-- Remove duplicate abandoned_carts rows, keeping the most-recent row per email.
DELETE FROM abandoned_carts
WHERE id NOT IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY customer_email ORDER BY created_at DESC) AS rn
    FROM abandoned_carts
  ) ranked
  WHERE rn = 1
);

-- Add unique constraint so future inserts can use ON CONFLICT.
ALTER TABLE abandoned_carts
  ADD CONSTRAINT abandoned_carts_customer_email_unique UNIQUE (customer_email);
