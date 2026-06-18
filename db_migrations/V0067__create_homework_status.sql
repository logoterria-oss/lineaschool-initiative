-- Статусы выполнения домашних заданий по конкретным урокам.
-- Педагог отмечает цветом: green (хорошо), yellow (плохо), red (не выполнено).
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.homework_status (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    student_name TEXT NOT NULL,
    lesson_date CHAR(10) NOT NULL,
    status TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (teacher_id, student_id, lesson_date)
);
CREATE INDEX IF NOT EXISTS idx_hw_teacher ON t_p93118852_lineaschool_initiati.homework_status (teacher_id);