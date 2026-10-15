ALTER TABLE t_p93118852_lineaschool_initiati.leads
  ADD COLUMN IF NOT EXISTS crm_diag_planned_at TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS crm_diag_done_at TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS crm_diag_note_lesson BIGINT NULL;