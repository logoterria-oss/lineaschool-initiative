CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.group_slot_limits (
  id SERIAL PRIMARY KEY,
  weekday SMALLINT NOT NULL,
  time_from VARCHAR(5) NOT NULL,
  teacher_id INTEGER NOT NULL,
  group_id INTEGER NULL,
  max_size SMALLINT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS group_slot_limits_dates_idx ON t_p93118852_lineaschool_initiati.group_slot_limits (date_to);