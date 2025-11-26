-- Таблиця для зберігання діалогів з лідами
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    telegram_username TEXT,
    first_name TEXT,
    last_name TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    assigned_to TEXT DEFAULT 'ai',
    lead_data JSONB DEFAULT '{}'::jsonb,
    notes TEXT
);

-- Таблиця для зберігання повідомлень
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER,
    sender TEXT NOT NULL,
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Таблиця для слотів діагностики
CREATE TABLE IF NOT EXISTS diagnostic_slots (
    id SERIAL PRIMARY KEY,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    booked_by INTEGER,
    booked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(slot_date, slot_time)
);

-- Індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_conversations_telegram_user_id ON conversations(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_slots_date ON diagnostic_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_diagnostic_slots_booked ON diagnostic_slots(is_booked);