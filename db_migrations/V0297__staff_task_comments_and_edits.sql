CREATE TABLE t_p93118852_lineaschool_initiati.staff_task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES t_p93118852_lineaschool_initiati.staff_tasks(id),
  author_id INTEGER NOT NULL REFERENCES t_p93118852_lineaschool_initiati.staff(id),
  recipient_id INTEGER NULL REFERENCES t_p93118852_lineaschool_initiati.staff(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  notified_at TIMESTAMP NULL
);
CREATE INDEX idx_staff_task_comments_task ON t_p93118852_lineaschool_initiati.staff_task_comments(task_id);
ALTER TABLE t_p93118852_lineaschool_initiati.staff_tasks ADD COLUMN original JSONB NULL;
ALTER TABLE t_p93118852_lineaschool_initiati.staff_tasks ADD COLUMN edited_at TIMESTAMP NULL;