ALTER TABLE t_p93118852_lineaschool_initiati.diag_bookings
  ADD COLUMN IF NOT EXISTS interaction_sent_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS interaction_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interaction_error TEXT NULL,
  ADD COLUMN IF NOT EXISTS dialog_id INTEGER NULL;