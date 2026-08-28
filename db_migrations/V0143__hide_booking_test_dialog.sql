UPDATE interaction_dialogs SET hidden = true, unread = 0
WHERE chat_id = 'booking-4' AND child_name = 'Новый Ребёнок Тестовый';

UPDATE interaction_dialogs SET unread = 0 WHERE id = 2;