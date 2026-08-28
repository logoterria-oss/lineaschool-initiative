-- Камнева выходит 22.09, значит последний день отпуска — 21.09
UPDATE t_p93118852_lineaschool_initiati.teacher_absences
SET date_to = '2026-09-21'
WHERE teacher_id = 11 AND date_from = '2026-09-07' AND date_to = '2026-09-22';