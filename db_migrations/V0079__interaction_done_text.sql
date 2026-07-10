-- "Сделано" становится текстовым полем; "done" (boolean) остаётся флагом "готово".
ALTER TABLE t_p93118852_lineaschool_initiati.student_interactions
    ADD COLUMN IF NOT EXISTS done_text TEXT DEFAULT '';
