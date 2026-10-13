CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.diag_slots (
  id SERIAL PRIMARY KEY,
  slot_date DATE NOT NULL,
  time_from VARCHAR(5) NOT NULL,
  time_to VARCHAR(5) NOT NULL,
  booking_id INTEGER NULL,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (slot_date, time_from)
);

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.diag_booking_links (
  id SERIAL PRIMARY KEY,
  token VARCHAR(40) NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  child_name TEXT NOT NULL DEFAULT '',
  parent_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  max_bookings INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.diag_bookings (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER NOT NULL,
  link_id INTEGER NOT NULL,
  slot_date DATE NOT NULL,
  time_from VARCHAR(5) NOT NULL,
  time_to VARCHAR(5) NOT NULL,
  child_name TEXT NOT NULL DEFAULT '',
  child_birth_date TEXT NOT NULL DEFAULT '',
  parent_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  telegram TEXT NOT NULL DEFAULT '',
  messengers TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  processed_by TEXT NOT NULL DEFAULT '',
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS diag_slots_date_idx ON t_p93118852_lineaschool_initiati.diag_slots (slot_date);
CREATE INDEX IF NOT EXISTS diag_bookings_status_idx ON t_p93118852_lineaschool_initiati.diag_bookings (status);