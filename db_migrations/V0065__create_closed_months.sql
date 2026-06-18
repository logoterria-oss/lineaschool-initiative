-- Months that have been reconciled with the accountant and are frozen for any changes.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.closed_months (
    month CHAR(7) PRIMARY KEY,
    closed_by TEXT DEFAULT 'head',
    closed_at TIMESTAMP DEFAULT NOW()
);