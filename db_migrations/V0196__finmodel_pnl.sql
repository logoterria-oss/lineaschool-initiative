CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_pnl_monthly (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    scenario VARCHAR(4) NOT NULL CHECK (scenario IN ('min','base','opt')),
    revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    variable NUMERIC(14,2) NOT NULL DEFAULT 0,
    gross_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
    fixed NUMERIC(14,2) NOT NULL DEFAULT 0,
    ano NUMERIC(14,2) NOT NULL DEFAULT 0,
    one_time NUMERIC(14,2) NOT NULL DEFAULT 0,
    ebitda NUMERIC(14,2) NOT NULL DEFAULT 0,
    interest NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_profit NUMERIC(14,2) NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, scenario)
);