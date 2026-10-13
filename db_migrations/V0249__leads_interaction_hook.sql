ALTER TABLE t_p93118852_lineaschool_initiati.leads
  ADD COLUMN IF NOT EXISTS interaction_sent_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS interaction_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interaction_error TEXT NULL,
  ADD COLUMN IF NOT EXISTS notify_text TEXT NULL;

UPDATE t_p93118852_lineaschool_initiati.leads
SET interaction_sent_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE interaction_sent_at IS NULL;