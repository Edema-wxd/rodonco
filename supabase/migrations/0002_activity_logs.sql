-- 0002_activity_logs.sql
-- Admin activity log table.

CREATE TABLE activity_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email   TEXT        NOT NULL,
  action        TEXT        NOT NULL,
  entity_id     TEXT,
  entity_label  TEXT,
  details       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX activity_logs_created_at_idx ON activity_logs (created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
-- No public policies — server accesses via direct DB connection only.
