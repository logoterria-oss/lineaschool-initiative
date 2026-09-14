-- Кеш расчёта по бросившим ученикам.
--
-- Расчёт тянет из CRM всю историю занятий с 2024 года — это долго,
-- поэтому результат складываем сюда и показываем из базы мгновенно,
-- а пересчёт запускаем отдельно (кнопкой «Обновить»).
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.dropout_cache (
    student_id    INTEGER PRIMARY KEY,
    name          TEXT NOT NULL DEFAULT '',
    left_at       DATE,
    first_lesson  DATE,
    months        NUMERIC(5,1) NOT NULL DEFAULT 0,
    teachers      JSONB NOT NULL DEFAULT '[]'::jsonb,
    synced_at     TIMESTAMP NOT NULL DEFAULT now()
);
