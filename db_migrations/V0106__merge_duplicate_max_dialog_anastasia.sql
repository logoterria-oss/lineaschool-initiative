-- Переносим сообщения из дубля #8 (Анастасия) в исходный диалог #6 (Анастасия Федорова)
UPDATE interaction_messages SET dialog_id = 6 WHERE dialog_id = 8;

-- Прописываем в исходный диалог реальные идентификаторы чата Max из дубля,
-- чтобы входящие из Max попадали сюда
UPDATE interaction_dialogs
SET max_chat_id = COALESCE(max_chat_id, '307899804'),
    max_user_id = COALESCE(max_user_id, '68548769'),
    last_time = GREATEST(last_time, (SELECT last_time FROM interaction_dialogs WHERE id = 8))
WHERE id = 6;

-- Прячем дубль
UPDATE interaction_dialogs SET hidden = true WHERE id = 8;