UPDATE t_p93118852_lineaschool_initiati.fm_avans_monthly
SET note = CASE WHEN month_id = '2025-09' THEN 'Сверено с бухгалтером. Запуск школы — в сезонность не входит' ELSE 'Сверено с бухгалтером' END
WHERE month_id BETWEEN '2025-09' AND '2026-08';

UPDATE t_p93118852_lineaschool_initiati.fm_fact_monthly
SET note = CASE WHEN month_id = '2025-09' THEN 'Сверено с бухгалтером (выручка фактическая). Запуск школы — в сезонность не входит' ELSE 'Сверено с бухгалтером (выручка фактическая)' END
WHERE month_id BETWEEN '2025-09' AND '2026-08';