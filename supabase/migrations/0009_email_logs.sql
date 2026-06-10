-- Migration: 0009_email_logs
-- Records every outgoing Resend send attempt for monitoring in the admin panel.

CREATE TABLE IF NOT EXISTS email_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           TEXT NOT NULL,
  "to"           TEXT NOT NULL,
  subject        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'sent',
  resend_id      TEXT,
  error          TEXT,
  order_reference TEXT,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_sent_at    ON email_logs (sent_at DESC);
CREATE INDEX idx_email_logs_type       ON email_logs (type);
CREATE INDEX idx_email_logs_status     ON email_logs (status);
