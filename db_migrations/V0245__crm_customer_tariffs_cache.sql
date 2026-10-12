-- Абонементы клиентов из CRM: по одному запросу на ребёнка, поэтому храним
-- последний ответ и обновляем по частям — иначе CRM отвечает «слишком много запросов».
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.crm_customer_tariffs_cache (
    customer_id INTEGER PRIMARY KEY,
    items       JSONB     NOT NULL DEFAULT '[]'::jsonb,
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);