-- Отметки смен хранились в UTC, а показываем мы московское время.
-- Переводим уже сохранённые отметки в МСК, дальше функция пишет сразу по Москве.
UPDATE t_p93118852_lineaschool_initiati.admin_shifts
SET started_at = started_at + INTERVAL '3 hours'
WHERE started_at IS NOT NULL;

UPDATE t_p93118852_lineaschool_initiati.admin_shifts
SET finished_at = finished_at + INTERVAL '3 hours'
WHERE finished_at IS NOT NULL;
