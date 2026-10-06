ALTER TABLE t_p93118852_lineaschool_initiati.fm_staff ADD COLUMN IF NOT EXISTS active_from VARCHAR(7) NULL;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_staff ADD COLUMN IF NOT EXISTS active_to VARCHAR(7) NULL;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_staff ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_staff DROP CONSTRAINT IF EXISTS fm_staff_role_check;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_staff ADD CONSTRAINT fm_staff_role_check CHECK (role IN ('teacher','ruo','admin','accountant','targetologist','developer','designer','other'));

ALTER TABLE t_p93118852_lineaschool_initiati.fm_expense_items ADD COLUMN IF NOT EXISTS active_from VARCHAR(7) NULL;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_expense_items ADD COLUMN IF NOT EXISTS active_to VARCHAR(7) NULL;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_expense_items ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_fixed_actual_lines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    grp VARCHAR(8) NOT NULL DEFAULT 'items' CHECK (grp IN ('staff','items')),
    sort INTEGER NOT NULL DEFAULT 0,
    source_key VARCHAR(48) NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_fixed_actual_values (
    line_id INTEGER NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_fixed_actual_lines(id),
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (line_id, month_id)
);

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_fixed_actual_months (
    month_id VARCHAR(7) PRIMARY KEY REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    seeded_at TIMESTAMP NOT NULL DEFAULT now()
);