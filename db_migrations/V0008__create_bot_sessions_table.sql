-- Create table for user sessions in bot
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.bot_sessions (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    telegram_username VARCHAR(255),
    state VARCHAR(50) NOT NULL DEFAULT 'idle',
    parent_name VARCHAR(255),
    child_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(telegram_user_id)
);

-- Add index for faster lookups
CREATE INDEX idx_bot_sessions_user_id ON t_p93118852_lineaschool_initiati.bot_sessions(telegram_user_id);
