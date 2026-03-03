CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.admin_notes (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    username TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);