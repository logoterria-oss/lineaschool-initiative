-- Раздел «Бросившие»: причина ухода и конфликты заполняются вручную.
--
-- ФИО, дату ухода, срок обучения и педагогов считаем из CRM автоматически,
-- а причину отказа и проблемы знает только администратор — их храним здесь.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.dropout_notes (
    student_id   INTEGER PRIMARY KEY,
    student_name TEXT,
    -- Дата ухода: обычно берём из CRM, но админ может поправить
    left_at      DATE,
    -- Причина отказа со слов родителя
    reason       TEXT NOT NULL DEFAULT '',
    -- Конфликты и проблемы, если были
    conflicts    TEXT NOT NULL DEFAULT '',
    updated_by   TEXT,
    updated_at   TIMESTAMP NOT NULL DEFAULT now()
);
