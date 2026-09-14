-- Разделяем две даты: последний урок (из CRM) и отказ (вводит админ).
-- Раньше обе жили в одном поле left_at, и ручная правка затирала расчёт.
ALTER TABLE t_p93118852_lineaschool_initiati.dropout_notes
    RENAME COLUMN left_at TO refused_at;

COMMENT ON COLUMN t_p93118852_lineaschool_initiati.dropout_notes.refused_at
    IS 'Дата отказа со слов родителя — заполняет администратор вручную';
