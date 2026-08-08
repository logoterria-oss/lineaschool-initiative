-- Объём диктанта у Боковой Софии: первичная — 34 слова, промежуточная — 35.
-- Нужен для пересчёта ошибок на 100 слов в динамике заключения.

UPDATE t_p93118852_lineaschool_initiati.speech_therapy_reports
SET form_data = (form_data::jsonb || '{"dictationWords": "34"}'::jsonb)::text
WHERE id = 87;

-- В промежуточной проставляем и текущий объём, и объём первичной
-- внутри снимка interimRwBaseline (оттуда заключение берёт «было»)
UPDATE t_p93118852_lineaschool_initiati.speech_therapy_reports
SET form_data = jsonb_set(
        form_data::jsonb || '{"dictationWords": "35"}'::jsonb,
        '{interimRwBaseline,dictationWords}',
        '"34"'::jsonb,
        true
    )::text
WHERE id = 210;
