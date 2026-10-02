CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_cashflow_monthly (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    scenario VARCHAR(4) NOT NULL CHECK (scenario IN ('min','base','opt')),
    start_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    variable NUMERIC(14,2) NOT NULL DEFAULT 0,
    fixed NUMERIC(14,2) NOT NULL DEFAULT 0,
    ano NUMERIC(14,2) NOT NULL DEFAULT 0,
    one_time NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax NUMERIC(14,2) NOT NULL DEFAULT 0,
    interest NUMERIC(14,2) NOT NULL DEFAULT 0,
    body NUMERIC(14,2) NOT NULL DEFAULT 0,
    payout NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_flow NUMERIC(14,2) NOT NULL DEFAULT 0,
    end_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, scenario)
);

UPDATE t_p93118852_lineaschool_initiati.fm_constants SET value_text = '2026-10-01'
WHERE key = 'start_balance_date' AND value_text IS NULL;