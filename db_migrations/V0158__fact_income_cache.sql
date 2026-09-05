-- Кэш фактических доходов по месяцам.
-- Пересчёт месяца тянет из CRM все занятия (несколько секунд), поэтому
-- закрытые месяцы считаем один раз и держим готовый результат.
CREATE TABLE IF NOT EXISTS fact_income_cache (
    month       varchar(7) PRIMARY KEY,
    payload     jsonb NOT NULL,
    computed_at timestamp NOT NULL DEFAULT now()
);
