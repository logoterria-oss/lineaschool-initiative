-- Обнуляем идентификаторы у скрытого дубля #8 (Анастасия), чтобы он не пересекался
-- по телефону/max-id с основным чатом #6 и не участвовал в поиске клиента.
UPDATE interaction_dialogs
SET phone = NULL, max_chat_id = NULL, max_user_id = NULL, tg_chat_id = NULL, tg_username = NULL
WHERE id = 8 AND hidden = true;