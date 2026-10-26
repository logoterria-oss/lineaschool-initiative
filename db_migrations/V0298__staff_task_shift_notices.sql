CREATE TABLE t_p93118852_lineaschool_initiati.staff_task_shift_notices (
  task_id INTEGER NOT NULL REFERENCES t_p93118852_lineaschool_initiati.staff_tasks(id),
  staff_id INTEGER NOT NULL REFERENCES t_p93118852_lineaschool_initiati.staff(id),
  notified_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, staff_id)
);
INSERT INTO t_p93118852_lineaschool_initiati.staff_task_shift_notices (task_id, staff_id)
SELECT t.id, sh.staff_id FROM t_p93118852_lineaschool_initiati.staff_tasks t
CROSS JOIN t_p93118852_lineaschool_initiati.admin_shifts sh
WHERE t.for_shift AND t.status <> 'open' AND sh.shift_date = CURRENT_DATE AND sh.started_at IS NOT NULL
ON CONFLICT DO NOTHING;