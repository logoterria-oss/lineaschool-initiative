ALTER TABLE interaction_dialogs ADD COLUMN IF NOT EXISTS max_chat_id VARCHAR(255);
ALTER TABLE interaction_dialogs ADD COLUMN IF NOT EXISTS max_user_id VARCHAR(255);