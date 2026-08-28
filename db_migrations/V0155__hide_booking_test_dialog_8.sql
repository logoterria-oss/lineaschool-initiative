-- Диалог от тестовой пакетной брони убираем из окна взаимодействия
UPDATE interaction_dialogs SET hidden = true, unread = 0
WHERE child_name = 'Пакетный Тест' AND chat_id LIKE 'booking-%';