-- Создаем новую таблицу для ссылок на заключения
CREATE TABLE diagnosis_reports (
    id SERIAL PRIMARY KEY,
    report_link TEXT NOT NULL,
    student_name TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);