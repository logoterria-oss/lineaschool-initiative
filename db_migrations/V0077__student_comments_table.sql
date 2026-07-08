CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.student_comments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    executor_id INTEGER,
    executor_name TEXT,
    comment_date DATE,
    done TEXT,
    parent_reply TEXT,
    extra TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_comments_student
    ON t_p93118852_lineaschool_initiati.student_comments (student_id, comment_date DESC);