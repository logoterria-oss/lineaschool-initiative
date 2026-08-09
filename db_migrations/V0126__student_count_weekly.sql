-- Еженедельные срезы численности учеников.
-- CRM хранит только текущий статус, истории в ней нет — поэтому
-- накапливаем свои снимки: раз в неделю (понедельник) записываем,
-- сколько учеников активны и сколько всего действующих.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.student_count_weekly (
    id SERIAL PRIMARY KEY,
    -- Понедельник недели, к которой относится срез
    week_start DATE NOT NULL UNIQUE,
    -- Ученики со статусом «Активен»
    active_count INTEGER NOT NULL DEFAULT 0,
    -- Все, кто ещё числится: активные + каникулы + замороженные
    enrolled_count INTEGER NOT NULL DEFAULT 0,
    -- Разбивка по статусам CRM на момент среза (для расшифровки в отчёте)
    status_breakdown JSONB,
    -- 'crm' — точный срез из CRM в этот понедельник,
    -- 'lessons' — восстановлено задним числом по занятиям (оценка)
    source TEXT NOT NULL DEFAULT 'crm',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_count_weekly_week
    ON t_p93118852_lineaschool_initiati.student_count_weekly (week_start);
