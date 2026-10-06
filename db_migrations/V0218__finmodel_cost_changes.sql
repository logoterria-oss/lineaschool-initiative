CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_cost_changes (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(8) NOT NULL CHECK (kind IN ('staff','item')),
    target_id VARCHAR(48) NOT NULL,
    from_month VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    amount NUMERIC(14,2) NOT NULL,
    shifts INTEGER NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (kind, target_id, from_month)
);