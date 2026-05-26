CREATE TABLE IF NOT EXISTS teacher_windows (
    id SERIAL PRIMARY KEY,
    teacher_name TEXT NOT NULL,
    teacher_name_normalized TEXT NOT NULL,
    weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
    time_from TIME NOT NULL,
    time_to TIME NOT NULL,
    comment TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_windows_normalized ON teacher_windows (teacher_name_normalized);
CREATE INDEX IF NOT EXISTS idx_teacher_windows_weekday ON teacher_windows (weekday);
