-- Модуль «Адаптивное прогнозирование» (Промт 13)
-- Прогноз, который модель показывала по месяцу, пока он был будущим. Обновляется, пока месяц в прогнозе;
-- после закрытия больше не перезаписывается — с ним сравнивается факт.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_forecast_snapshots (
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    metric VARCHAR(24) NOT NULL,
    item_id VARCHAR(48) NOT NULL DEFAULT '',
    scenario VARCHAR(4) NOT NULL DEFAULT 'base',
    value NUMERIC(14,4) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, metric, item_id, scenario)
);

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_adaptation_log (
    id SERIAL PRIMARY KEY,
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    metric VARCHAR(24) NOT NULL CHECK (metric IN ('avans','fact','variable_pct','fixed_expense','new_item')),
    item_id VARCHAR(48) NOT NULL DEFAULT '',
    scenario VARCHAR(4) NOT NULL DEFAULT 'base',
    forecast NUMERIC(14,4) NOT NULL,
    actual NUMERIC(14,4) NOT NULL,
    deviation NUMERIC(14,4) NOT NULL,
    deviation_pct NUMERIC(10,4) NULL,
    correction NUMERIC(14,4) NOT NULL DEFAULT 0,
    applied_to VARCHAR(64) NOT NULL DEFAULT '',
    k_coef NUMERIC(6,4) NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','skipped','cancelled')),
    source VARCHAR(8) NOT NULL DEFAULT 'auto' CHECK (source IN ('auto','manual')),
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    cancelled_at TIMESTAMP NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS fm_adaptation_log_auto_uq
    ON t_p93118852_lineaschool_initiati.fm_adaptation_log (month_id, metric, item_id) WHERE source = 'auto';

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_adaptation_corrections (
    id SERIAL PRIMARY KEY,
    month_id VARCHAR(7) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    metric VARCHAR(24) NOT NULL,
    item_id VARCHAR(48) NOT NULL DEFAULT '',
    correction NUMERIC(14,4) NOT NULL,
    source_log_id INTEGER NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_adaptation_log(id)
);
CREATE INDEX IF NOT EXISTS fm_adaptation_corrections_m ON t_p93118852_lineaschool_initiati.fm_adaptation_corrections (metric, month_id);

ALTER TABLE t_p93118852_lineaschool_initiati.fm_avans_forecast ADD COLUMN IF NOT EXISTS correction NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_fact_forecast ADD COLUMN IF NOT EXISTS correction NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE t_p93118852_lineaschool_initiati.fm_revenue_monthly ADD COLUMN IF NOT EXISTS variable_pct_correction NUMERIC(7,4) NOT NULL DEFAULT 0;

INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key,label,value_num,unit,note) VALUES
('adapt_k','Коэффициент адаптации K',0.5,'coef','0 — без адаптации, 1 — прогноз = факт'),
('adapt_systematic_months','Систематическое отклонение, месяцев подряд',3,'month','для постоянных расходов'),
('adapt_min_deviation_pct','Мин. отклонение для адаптации, %',5,'pct','меньше — не корректируем'),
('adapt_min_deviation_pp','Мин. отклонение переменного %, п.п.',0.5,'pp','для переменного процента'),
('adapt_alert_pct','Порог уведомления, %',20,'pct','отклонение больше — уведомление')
ON CONFLICT (key) DO NOTHING;