-- Помечаем технические карточки CRM («Тест-ученик-1», «Тестовый ученик»),
-- чтобы они не попадали в отчёт о численности и не завышали цифры.
ALTER TABLE t_p93118852_lineaschool_initiati.student_roster
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_student_roster_is_test
    ON t_p93118852_lineaschool_initiati.student_roster (is_test);
