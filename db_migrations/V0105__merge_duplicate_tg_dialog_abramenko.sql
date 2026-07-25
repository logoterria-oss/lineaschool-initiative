-- Переносим сообщения из диалога-дубля #4 в исходный #1
UPDATE interaction_messages SET dialog_id = 1 WHERE dialog_id = 4;

-- Прописываем tg_chat_id в исходный диалог, чтобы входящие из TG попадали сюда
UPDATE interaction_dialogs
SET tg_chat_id = '1112267464',
    last_time = GREATEST(last_time, (SELECT last_time FROM interaction_dialogs WHERE id = 4))
WHERE id = 1;

-- Прячем дубль
UPDATE interaction_dialogs SET hidden = true WHERE id = 4;