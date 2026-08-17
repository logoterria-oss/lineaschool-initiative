CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.admin_shifts (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    shift_date DATE NOT NULL,
    time_from VARCHAR(5) NOT NULL DEFAULT '09:00',
    time_to VARCHAR(5) NOT NULL DEFAULT '18:00',
    kind VARCHAR(20) NOT NULL DEFAULT 'work',
    note TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_shifts_uniq
    ON t_p93118852_lineaschool_initiati.admin_shifts (staff_id, shift_date);

CREATE INDEX IF NOT EXISTS admin_shifts_date_idx
    ON t_p93118852_lineaschool_initiati.admin_shifts (shift_date);
