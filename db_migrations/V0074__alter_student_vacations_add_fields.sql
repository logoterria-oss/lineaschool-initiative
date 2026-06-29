ALTER TABLE t_p93118852_lineaschool_initiati.student_vacations
  ADD COLUMN IF NOT EXISTS vacation_end_type VARCHAR(20) DEFAULT 'exact',
  ADD COLUMN IF NOT EXISTS first_lesson_date DATE,
  ADD COLUMN IF NOT EXISTS first_lesson_status VARCHAR(20) DEFAULT 'not_agreed';
