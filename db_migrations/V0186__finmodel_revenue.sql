-- Модуль «Поступления и переменные». Поступления — от аванса, переменные — от факта.

CREATE TABLE t_p93118852_lineaschool_initiati.fm_variable_pct_monthly (
    month_id VARCHAR(7) PRIMARY KEY REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    variable_pct NUMERIC(7,4) NOT NULL CHECK (variable_pct >= 0 AND variable_pct <= 100),
    margin_pct NUMERIC(7,4) NULL,
    source VARCHAR(8) NOT NULL CHECK (source IN ('report','override')),
    note TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_variable_pct_monthly (month_id, variable_pct, margin_pct, source, note) VALUES
('2026-09', 44.52, 55.48, 'report', 'Отчёт «Маржинальность урока» → «Средняя маржинальность за месяц»');

CREATE TABLE t_p93118852_lineaschool_initiati.fm_revenue_monthly (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    scenario VARCHAR(4) NOT NULL CHECK (scenario IN ('min','base','opt')),
    avans NUMERIC(14,2) NOT NULL,
    fact NUMERIC(14,2) NOT NULL,
    acquiring_pct NUMERIC(7,4) NOT NULL,
    revenue NUMERIC(14,2) NOT NULL,
    variable_pct NUMERIC(7,4) NOT NULL,
    variable_pct_source VARCHAR(8) NOT NULL,
    variable_amount NUMERIC(14,2) NOT NULL,
    margin_amount NUMERIC(14,2) NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, scenario)
);