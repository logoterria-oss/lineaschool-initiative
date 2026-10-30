CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.admin_response_stats (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  staff_id INTEGER NULL,
  staff_name VARCHAR(255) NULL,
  stat_date DATE NOT NULL,
  dialogs INTEGER NOT NULL DEFAULT 0,
  total_minutes NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (phone, stat_date)
);
CREATE INDEX IF NOT EXISTS admin_response_stats_date_idx ON t_p93118852_lineaschool_initiati.admin_response_stats (stat_date);