-- Заключение берёт текущие показатели из снимка interimReadingWriting,
-- поэтому объём диктанта нужен и там (35 слов).

UPDATE t_p93118852_lineaschool_initiati.speech_therapy_reports
SET form_data = jsonb_set(
        form_data::jsonb,
        '{interimReadingWriting,dictationWords}',
        '"35"'::jsonb,
        true
    )::text
WHERE id = 210;
