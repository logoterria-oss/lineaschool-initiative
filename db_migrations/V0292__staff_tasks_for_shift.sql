ALTER TABLE t_p93118852_lineaschool_initiati.staff_tasks ADD COLUMN for_shift BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE t_p93118852_lineaschool_initiati.staff_tasks ADD COLUMN done_by INTEGER NULL REFERENCES t_p93118852_lineaschool_initiati.staff(id);
ALTER TABLE t_p93118852_lineaschool_initiati.admin_shifts ADD COLUMN tasks_reminded_at TIMESTAMP NULL;
UPDATE t_p93118852_lineaschool_initiati.admin_shifts SET tasks_reminded_at = now() WHERE started_at IS NOT NULL;