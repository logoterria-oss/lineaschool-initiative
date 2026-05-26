CREATE TABLE IF NOT EXISTS teacher_work_schedule (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    teacher_name VARCHAR(200) NOT NULL,
    weekday SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    time_from VARCHAR(5) NOT NULL,
    time_to VARCHAR(5) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tws_teacher ON teacher_work_schedule(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tws_weekday ON teacher_work_schedule(weekday);