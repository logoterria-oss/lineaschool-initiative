CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.work_log (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    staff_role VARCHAR(20) NOT NULL DEFAULT 'admin',
    log_date DATE NOT NULL,
    task_code VARCHAR(20) NOT NULL,
    task_title TEXT NOT NULL,
    category VARCHAR(40) NOT NULL DEFAULT 'other',
    subject VARCHAR(255),
    comment TEXT,
    minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_log_staff_date
ON t_p93118852_lineaschool_initiati.work_log (staff_id, log_date);

CREATE INDEX IF NOT EXISTS idx_work_log_date
ON t_p93118852_lineaschool_initiati.work_log (log_date);