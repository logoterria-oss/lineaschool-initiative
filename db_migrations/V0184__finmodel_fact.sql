-- Модуль «Доходы: фактические доходы». Факт (оказанные уроки) — отдельная сущность от аванса (fm_avans_monthly).

CREATE TABLE t_p93118852_lineaschool_initiati.fm_fact_monthly (
    month_id VARCHAR(7) PRIMARY KEY REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    fact NUMERIC(14,2) NOT NULL,
    source VARCHAR(8) NOT NULL CHECK (source IN ('report','manual')),
    closed BOOLEAN NOT NULL DEFAULT false,
    closed_at TIMESTAMP NULL,
    exclude_from_seasonality BOOLEAN NOT NULL DEFAULT false,
    note TEXT NOT NULL DEFAULT ''
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_fact_monthly (month_id, fact, source, closed, closed_at, exclude_from_seasonality, note) VALUES
('2025-09',76880,'manual',true,now(),true,'Запуск школы — нетипичный месяц, в сезонность и коэффициенты не входит'),
('2025-10',281312,'manual',true,now(),false,''),
('2025-11',354075,'manual',true,now(),false,''),
('2025-12',434364,'manual',true,now(),false,''),
('2026-01',401526,'manual',true,now(),false,''),
('2026-02',547461,'manual',true,now(),false,''),
('2026-03',719251,'manual',true,now(),false,''),
('2026-04',671150,'manual',true,now(),false,''),
('2026-05',551480,'manual',true,now(),false,''),
('2026-06',359760,'manual',true,now(),false,''),
('2026-07',390210,'manual',true,now(),false,''),
('2026-08',293420,'manual',true,now(),false,''),
('2026-09',457970,'manual',true,now(),false,'Из утверждённой таблицы. Отчёт «Фактические доходы» на 02.10.2026 показывает 475 070 ₽');

CREATE TABLE t_p93118852_lineaschool_initiati.fm_fact_coefs (
    month_num SMALLINT PRIMARY KEY CHECK (month_num BETWEEN 1 AND 12),
    coef NUMERIC(10,6) NOT NULL,
    fact NUMERIC(14,2) NOT NULL,
    avans NUMERIC(14,2) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    source_period VARCHAR(64) NOT NULL
);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_seasonality_fact (
    month_num SMALLINT PRIMARY KEY CHECK (month_num BETWEEN 1 AND 12),
    share_pct NUMERIC(9,6) NOT NULL,
    fact NUMERIC(14,2) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    source_period VARCHAR(64) NOT NULL
);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_fact_forecast (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    scenario VARCHAR(4) NOT NULL CHECK (scenario IN ('min','base','opt')),
    fact_prev_year NUMERIC(14,2) NULL,
    avans_forecast NUMERIC(14,2) NOT NULL,
    coef NUMERIC(10,6) NOT NULL,
    fact_direct NUMERIC(14,2) NOT NULL,
    fact_seasonal NUMERIC(14,2) NOT NULL,
    diff_pct NUMERIC(9,4) NOT NULL,
    fact_final NUMERIC(14,2) NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, scenario)
);