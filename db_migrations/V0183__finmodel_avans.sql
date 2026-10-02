-- Модуль «Доходы: авансы». Факт (оказанные уроки) здесь НЕ хранится.

CREATE TABLE t_p93118852_lineaschool_initiati.fm_avans_monthly (
    month_id VARCHAR(7) PRIMARY KEY REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    avans NUMERIC(14,2) NOT NULL,
    source VARCHAR(8) NOT NULL CHECK (source IN ('report','manual')),
    closed BOOLEAN NOT NULL DEFAULT false,
    closed_at TIMESTAMP NULL,
    exclude_from_seasonality BOOLEAN NOT NULL DEFAULT false,
    note TEXT NOT NULL DEFAULT ''
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_avans_monthly (month_id, avans, source, closed, closed_at, exclude_from_seasonality, note) VALUES
('2025-09',323320,'manual',true,now(),true,'Запуск школы — нетипичный месяц, в сезонность не входит'),
('2025-10',347440,'manual',true,now(),false,''),
('2025-11',377920,'manual',true,now(),false,''),
('2025-12',574780,'manual',true,now(),false,''),
('2026-01',489526,'manual',true,now(),false,''),
('2026-02',577650,'manual',true,now(),false,''),
('2026-03',684510,'manual',true,now(),false,''),
('2026-04',550950,'manual',true,now(),false,''),
('2026-05',479640,'manual',true,now(),false,''),
('2026-06',324380,'manual',true,now(),false,''),
('2026-07',354570,'manual',true,now(),false,''),
('2026-08',664720,'manual',true,now(),false,''),
('2026-09',514750,'report',true,now(),false,'Сверено с отчётом «Авансовые доходы» 02.10.2026');

CREATE TABLE t_p93118852_lineaschool_initiati.fm_seasonality (
    month_num SMALLINT PRIMARY KEY CHECK (month_num BETWEEN 1 AND 12),
    share_pct NUMERIC(9,6) NOT NULL,
    avans NUMERIC(14,2) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    source_period VARCHAR(64) NOT NULL
);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_avans_forecast (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    scenario VARCHAR(4) NOT NULL CHECK (scenario IN ('min','base','opt')),
    avans_prev_year NUMERIC(14,2) NULL,
    prev_year_source VARCHAR(8) NOT NULL DEFAULT 'fact',
    coef NUMERIC(6,3) NOT NULL,
    forecast_direct NUMERIC(14,2) NULL,
    forecast_seasonal NUMERIC(14,2) NULL,
    diff_pct NUMERIC(9,4) NULL,
    forecast_final NUMERIC(14,2) NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, scenario)
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key,label,value_num,value_text,value_date,unit,needs_clarification,note) VALUES
('avans_coef_min','Авансы: коэф. роста, минимальный',1.2,NULL,NULL,'coef',false,'к тому же месяцу прошлого года'),
('avans_coef_base','Авансы: коэф. роста, базовый',1.4,NULL,NULL,'coef',false,''),
('avans_coef_opt','Авансы: коэф. роста, оптимистичный',1.6,NULL,NULL,'coef',false,''),
('avans_scenario_active','Авансы: активный сценарий',NULL,'base',NULL,'text',false,'min / base / opt'),
('avans_seasonal_threshold_pct','Порог расхождения прямого и сезонного прогноза',15,NULL,NULL,'%',false,'больше — берём среднее'),
('seasonality_method','Метод сезонности',NULL,'window12',NULL,'text',false,'window12 — скользящее окно; exp — сглаживание'),
('seasonality_alpha','Альфа сглаживания сезонности',0.3,NULL,NULL,'coef',false,'для метода exp'),
('forecast_horizon_months','Горизонт прогноза, мес',12,NULL,NULL,'month',false,'')
ON CONFLICT (key) DO NOTHING;