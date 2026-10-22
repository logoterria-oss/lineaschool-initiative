CREATE TABLE t_p93118852_lineaschool_initiati.staff_tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author_id INTEGER NOT NULL REFERENCES t_p93118852_lineaschool_initiati.staff(id),
  assignee_id INTEGER NOT NULL REFERENCES t_p93118852_lineaschool_initiati.staff(id),
  due_date DATE NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'open',
  done_at TIMESTAMP NULL,
  done_comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX staff_tasks_assignee_idx ON t_p93118852_lineaschool_initiati.staff_tasks (assignee_id, status);
CREATE INDEX staff_tasks_author_idx ON t_p93118852_lineaschool_initiati.staff_tasks (author_id, status);