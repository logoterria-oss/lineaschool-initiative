CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.teacher_rates (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    teacher_name VARCHAR(255) NOT NULL DEFAULT '',
    lesson_form VARCHAR(20) NOT NULL,
    period_key VARCHAR(32) NOT NULL,
    current_rate INTEGER,
    planned_rate INTEGER,
    planned_locked BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, lesson_form, period_key)
);
