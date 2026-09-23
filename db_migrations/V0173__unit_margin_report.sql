-- Кэш факта месяца для отчёта «Маржинальность урока».
-- Юнит расчёта — один проведённый урок (для группового: один ученико-урок).
-- Запрос в AlfaCRM за месяц тяжёлый (сотни уроков × детали), поэтому
-- держим готовый срез: уроки и списания в разрезе формы занятия и педагога.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.margin_unit_cache (
    month       VARCHAR(7) PRIMARY KEY,
    payload     JSONB     NOT NULL DEFAULT '{}'::jsonb,
    computed_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Сохранённые расчёты маржинальности урока: один расчёт = один месяц.
-- Храним и вход (ставки, проценты), и результат, чтобы динамика строилась
-- по сохранённым цифрам, а не пересчитывалась задним числом.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.unit_margin_reports (
    id           SERIAL PRIMARY KEY,
    period_month VARCHAR(7)   NOT NULL DEFAULT '',
    title        VARCHAR(255) NOT NULL DEFAULT '',
    inputs       JSONB        NOT NULL DEFAULT '{}'::jsonb,
    result       JSONB        NOT NULL DEFAULT '{}'::jsonb,
    note         TEXT         NOT NULL DEFAULT '',
    author       VARCHAR(255) NOT NULL DEFAULT '',
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS unit_margin_reports_month_idx
    ON t_p93118852_lineaschool_initiati.unit_margin_reports (period_month DESC, created_at DESC);

-- Пресет ставок и процентов (СФР, эквайринг, отпускные). Всегда одна строка.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.unit_margin_defaults (
    id         INTEGER PRIMARY KEY DEFAULT 1,
    payload    JSONB     NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);