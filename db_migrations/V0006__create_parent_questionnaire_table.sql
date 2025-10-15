-- Таблица для анкетных данных от родителей
CREATE TABLE IF NOT EXISTS parent_questionnaire (
    id SERIAL PRIMARY KEY,
    -- Контактные данные родителя
    parent_name VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(50) NOT NULL,
    parent_email VARCHAR(255),
    
    -- Данные ребенка
    child_name VARCHAR(255) NOT NULL,
    birth_date VARCHAR(50),
    grade VARCHAR(50),
    
    -- Образование
    education_type VARCHAR(255),
    aoop_required VARCHAR(10),
    aoop_variant VARCHAR(100),
    school_start_age VARCHAR(50),
    kindergarten VARCHAR(50),
    
    -- Анамнестические данные
    prenatal_development TEXT,
    neurological_disorders TEXT,
    hearing_vision_disorders TEXT,
    chronic_diseases TEXT,
    speech_environment TEXT,
    previous_specialists TEXT,
    speech_therapist_conclusion TEXT,
    neuropsychologist_conclusion TEXT,
    defectologist_conclusion TEXT,
    dominant_hand VARCHAR(100),
    
    -- Метаданные
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по ФИО ребенка
CREATE INDEX IF NOT EXISTS idx_child_name ON parent_questionnaire(child_name);

-- Индекс для поиска по телефону родителя
CREATE INDEX IF NOT EXISTS idx_parent_phone ON parent_questionnaire(parent_phone);