CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.student_vacations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    note TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_student_vacations_student_id
    ON t_p93118852_lineaschool_initiati.student_vacations(student_id);
