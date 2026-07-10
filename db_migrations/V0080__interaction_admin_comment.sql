-- Комментарий администратора к взаимодействию (отображается курсивом).
ALTER TABLE t_p93118852_lineaschool_initiati.student_interactions
    ADD COLUMN IF NOT EXISTS admin_comment TEXT DEFAULT '';
