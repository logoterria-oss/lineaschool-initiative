-- Создание таблицы для хранения ссылок на заключения (админ-панель)
CREATE TABLE IF NOT EXISTS diagnosis_reports (
    id SERIAL PRIMARY KEY,
    report_link VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_diagnosis_reports_report_link ON diagnosis_reports(report_link);
CREATE INDEX IF NOT EXISTS idx_diagnosis_reports_date ON diagnosis_reports(date);

-- Создание таблицы для полных заключений (пока не используется, но может понадобиться)
CREATE TABLE IF NOT EXISTS speech_therapy_reports (
    id SERIAL PRIMARY KEY,
    student_name VARCHAR(255) NOT NULL,
    student_age INTEGER,
    date_of_examination DATE,
    therapist_name VARCHAR(255),
    diagnosis TEXT,
    recommendations TEXT,
    report_content TEXT,
    form_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);