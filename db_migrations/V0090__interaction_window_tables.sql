CREATE TABLE IF NOT EXISTS interaction_dialogs (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(20) NOT NULL DEFAULT 'max',
    chat_id VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    phone VARCHAR(50),
    assignee VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'lead',
    unread INTEGER NOT NULL DEFAULT 0,
    last_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (channel, chat_id)
);

CREATE TABLE IF NOT EXISTS interaction_messages (
    id SERIAL PRIMARY KEY,
    dialog_id INTEGER NOT NULL REFERENCES interaction_dialogs(id),
    direction VARCHAR(3) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'max',
    text TEXT,
    author VARCHAR(255),
    is_transcript BOOLEAN NOT NULL DEFAULT false,
    wappi_message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interaction_messages_dialog ON interaction_messages(dialog_id);
CREATE INDEX IF NOT EXISTS idx_interaction_dialogs_last ON interaction_dialogs(last_time DESC);