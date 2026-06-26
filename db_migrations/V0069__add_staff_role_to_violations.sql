ALTER TABLE t_p93118852_lineaschool_initiati.violations
  ADD COLUMN IF NOT EXISTS staff_role VARCHAR(20) NOT NULL DEFAULT 'teacher';