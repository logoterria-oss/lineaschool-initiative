-- Общий кэш ответов CRM (клиенты, группы, педагоги, неделя групп):
-- CRM ограничивает частоту запросов, поэтому повторно не спрашиваем,
-- а при отказе CRM показываем последние сохранённые данные.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.crm_json_cache (
    cache_key  VARCHAR(200) PRIMARY KEY,
    payload    JSONB     NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);