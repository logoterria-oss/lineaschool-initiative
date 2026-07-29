CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.teacher_absences (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    teacher_name VARCHAR(200) NOT NULL DEFAULT '',
    kind VARCHAR(20) NOT NULL DEFAULT 'dayoff',  -- 'dayoff' (выходной) | 'vacation' (отпуск)
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    time_from VARCHAR(5),  -- NULL = весь день; для выходного можно указать интервал
    time_to VARCHAR(5),
    note TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ta_teacher ON t_p93118852_lineaschool_initiati.teacher_absences(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ta_dates ON t_p93118852_lineaschool_initiati.teacher_absences(teacher_id, date_from, date_to);