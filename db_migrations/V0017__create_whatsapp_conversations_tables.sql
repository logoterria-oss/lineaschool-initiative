-- Create conversations table for tracking customer dialogues
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT DEFAULT 0,
    first_name VARCHAR(255),
    telegram_username VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    assigned_to VARCHAR(50) DEFAULT 'ai',
    lead_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table for storing conversation history
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    sender VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster conversation lookups by phone
CREATE INDEX IF NOT EXISTS idx_conversations_username ON conversations(telegram_username);

-- Create index for faster message lookups by conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);