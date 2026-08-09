-- Периоды действия абонементов каждого ученика.
-- Нужны, чтобы вычислять численность на любую прошлую неделю прямо из
-- данных CRM, не полагаясь на регулярное снятие снимков.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.student_tariff_spans (
    customer_id INTEGER PRIMARY KEY,
    -- Массив пар [дата начала, дата окончания] в виде строк YYYY-MM-DD
    periods JSONB NOT NULL DEFAULT '[]'::jsonb,
    synced_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tariff_spans_synced
    ON t_p93118852_lineaschool_initiati.student_tariff_spans (synced_at);
