ALTER TABLE interaction_dialogs ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;
-- Скрываем тестовый диалог, созданный при проверке кнопки «+».
UPDATE interaction_dialogs SET hidden = true WHERE chat_id = '79161183429';