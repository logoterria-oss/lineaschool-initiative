-- Технические диалоги от проверок бронирования: убираем из окна взаимодействия
UPDATE interaction_dialogs SET hidden = true, unread = 0
WHERE chat_id LIKE 'booking-%';

UPDATE interaction_dialogs SET unread = 0 WHERE id = 2;