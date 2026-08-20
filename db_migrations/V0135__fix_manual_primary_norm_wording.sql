-- Исправляем формулировки в вручную внесённых первичных диагностиках:
-- уровень «норма» ошибочно сохранялся как «... нарушена: норма»
UPDATE t_p93118852_lineaschool_initiati.speech_therapy_reports
SET form_data = (
    (form_data::jsonb)
    || jsonb_build_object(
        'motorRealization',
        COALESCE((
            SELECT jsonb_agg(
                CASE
                    WHEN lower(x) = 'звукопроизношение нарушено: норма' THEN 'норма'
                    WHEN lower(x) = 'слоговая структура слова нарушена: норма' THEN 'слоговая структура слова не нарушена'
                    WHEN lower(x) = 'кинетический артикуляционный праксис нарушен: норма' THEN 'кинетический артикуляционный праксис в норме'
                    ELSE x
                END
            )
            FROM jsonb_array_elements_text(form_data::jsonb -> 'motorRealization') AS t(x)
        ), '[]'::jsonb),
        'connectedSpeech',
        COALESCE((
            SELECT jsonb_agg(
                CASE WHEN lower(x) = 'связная речь нарушена: норма' THEN 'норма' ELSE x END
            )
            FROM jsonb_array_elements_text(form_data::jsonb -> 'connectedSpeech') AS t(x)
        ), '[]'::jsonb)
    )
)::text
WHERE form_data::jsonb ->> 'manualEntry' = 'true'
  AND form_data::text ILIKE '%нарушен%: норма%';
