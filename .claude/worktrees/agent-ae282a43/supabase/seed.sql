-- seed.sql — Applied via: npx supabase@latest db query --file supabase/seed.sql
-- Seeds the single ordering_config row (FOUND-04).

INSERT INTO ordering_config (id, is_ordering_open, next_delivery_date)
VALUES (
  1,
  true,
  -- Next Saturday from seed date
  (CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7 + 7))::DATE
)
ON CONFLICT (id) DO NOTHING;
