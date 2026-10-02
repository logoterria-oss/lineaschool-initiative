-- Промт 4.1: ученики и занятия по месяцам (справочные показатели для прогноза доходов).
-- Вариант А: все три показателя уже есть в отчётах админки, отдельное подключение AlfaCRM не нужно.

CREATE TABLE t_p93118852_lineaschool_initiati.fm_students_monthly (
    month_id VARCHAR(7) PRIMARY KEY REFERENCES t_p93118852_lineaschool_initiati.fm_months(id),
    active_students INTEGER NULL,
    total_lessons INTEGER NULL,
    avg_lessons_per_student NUMERIC(8,2) NULL,
    avg_group_fill NUMERIC(8,2) NULL,
    source VARCHAR(8) NOT NULL CHECK (source IN ('alfa','report','manual')),
    lessons_source VARCHAR(10) NOT NULL DEFAULT 'report' CHECK (lessons_source IN ('report','manual')),
    closed BOOLEAN NOT NULL DEFAULT false,
    note TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- «Лидеры и тенденции» — несуществующий показатель: выключаем из модели.
ALTER TABLE t_p93118852_lineaschool_initiati.fm_metric_sources ADD COLUMN in_model BOOLEAN NOT NULL DEFAULT true;
UPDATE t_p93118852_lineaschool_initiati.fm_metric_sources SET in_model = false,
    note = 'Такого показателя в модели нет — исключён (Промт 4.1)'
WHERE metric_key = 'leaders_trends';

UPDATE t_p93118852_lineaschool_initiati.fm_metric_sources SET
    source_type = 'report', report_name = 'Отчёты → Динамика учеников', status = 'connected',
    field_path = 'student_count_weekly.active_count на последнюю неделю месяца',
    used_in = 'Прогноз авансов (справочно), уроков на ученика',
    note = 'Уже есть в админке — отдельное подключение AlfaCRM не нужно'
WHERE metric_key = 'active_students';

UPDATE t_p93118852_lineaschool_initiati.fm_metric_sources SET
    used_in = 'Справочно (в переменных расходах не участвует)'
WHERE metric_key = 'avg_group_fill';

UPDATE t_p93118852_lineaschool_initiati.fm_metric_sources SET
    field_path = '(individual.lessons + group.lessons) / active_students', status = 'connected',
    used_in = 'Справочно (в переменных расходах не участвует)',
    note = 'Считается: всего занятий из «Маржинальности урока» / активные ученики'
WHERE metric_key = 'avg_lessons_per_student';

INSERT INTO t_p93118852_lineaschool_initiati.fm_constants (key,label,value_num,value_text,value_date,unit,needs_clarification,note) VALUES
('alfa_api_url','AlfaCRM: адрес API',NULL,'',NULL,'text',false,'Пусто: отдельное подключение не используется — ученики берутся из отчёта «Динамика учеников»'),
('alfa_api_key','AlfaCRM: ключ API',NULL,'',NULL,'text',false,'Ключ в БД не храним — только в секретах проекта (ALFACRM_API_KEY)'),
('alfa_email','AlfaCRM: email',NULL,'',NULL,'text',false,'В секретах проекта (ALFACRM_EMAIL)')
ON CONFLICT (key) DO NOTHING;