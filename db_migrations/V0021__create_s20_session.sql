CREATE TABLE IF NOT EXISTS s20_session (
    id SERIAL PRIMARY KEY,
    cookies TEXT NOT NULL,
    csrf TEXT,
    is_authenticated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);