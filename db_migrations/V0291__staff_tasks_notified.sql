ALTER TABLE t_p93118852_lineaschool_initiati.staff_tasks ADD COLUMN notified_at TIMESTAMP NULL;
UPDATE t_p93118852_lineaschool_initiati.staff_tasks SET notified_at = now();