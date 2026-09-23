-- Кэш выборки из CRM по месяцам для отчёта маржинальности.
-- Запрос в AlfaCRM за месяц занятий тяжёлый (сотни уроков × детали),
-- поэтому считаем один раз и держим готовый срез: уроки по тарифам,
-- педагогам и размерам групп.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.margin_crm_cache (
    month       VARCHAR(7) PRIMARY KEY,
    payload     JSONB     NOT NULL DEFAULT '{}'::jsonb,
    computed_at TIMESTAMP NOT NULL DEFAULT now()
);
