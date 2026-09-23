-- Отчёты «Маржинальность абонементов» для руководителя.
-- Один отчёт = один расчёт по конкретному абонементу за конкретный месяц.
-- Храним и входные данные (assumptions), и посчитанный результат (result),
-- чтобы динамика строилась по сохранённым цифрам, а не пересчитывалась задним числом.

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.margin_reports (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(255) NOT NULL DEFAULT '',
    tariff_key    VARCHAR(255) NOT NULL DEFAULT '',
    tariff_name   VARCHAR(500) NOT NULL DEFAULT '',
    period_month  VARCHAR(7)   NOT NULL DEFAULT '',
    inputs        JSONB        NOT NULL DEFAULT '{}'::jsonb,
    result        JSONB        NOT NULL DEFAULT '{}'::jsonb,
    note          TEXT         NOT NULL DEFAULT '',
    author        VARCHAR(255) NOT NULL DEFAULT '',
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS margin_reports_tariff_idx
    ON t_p93118852_lineaschool_initiati.margin_reports (tariff_key, period_month);

CREATE INDEX IF NOT EXISTS margin_reports_created_idx
    ON t_p93118852_lineaschool_initiati.margin_reports (created_at DESC);

-- Пресет косвенных расходов: то, что меняется редко и одинаково для всех отчётов.
-- Всегда одна строка с id = 1, правим её через UPSERT.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.margin_defaults (
    id         INTEGER PRIMARY KEY DEFAULT 1,
    payload    JSONB     NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
