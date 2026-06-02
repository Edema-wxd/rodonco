-- L6: index on activity_logs.created_at to speed up the Activity feed query
-- (ORDER BY created_at DESC) and future cursor-based pagination.
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx
  ON activity_logs (created_at DESC);
