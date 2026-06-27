CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.student_diagnostics (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    diagnostic_date DATE NOT NULL,
    recommendations TEXT,
    report_link TEXT,
    is_first BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_student_diagnostics_student
    ON t_p93118852_lineaschool_initiati.student_diagnostics (student_id, diagnostic_date DESC);