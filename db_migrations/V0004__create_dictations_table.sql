-- Create table for storing dictations from Telegram bot
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.dictations (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    telegram_username VARCHAR(255),
    parent_name VARCHAR(255),
    child_name VARCHAR(255) NOT NULL,
    photo_file_id VARCHAR(500) NOT NULL,
    photo_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    diagnostician_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_at TIMESTAMP,
    checked_by VARCHAR(255)
);

-- Create index for faster queries
CREATE INDEX idx_dictations_status ON t_p93118852_lineaschool_initiati.dictations(status);
CREATE INDEX idx_dictations_created ON t_p93118852_lineaschool_initiati.dictations(created_at DESC);