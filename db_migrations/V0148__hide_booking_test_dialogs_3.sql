-- Диалоги от тестовых броней убираем из окна взаимодействия
UPDATE interaction_dialogs SET hidden = true, unread = 0
WHERE chat_id LIKE 'booking-%';