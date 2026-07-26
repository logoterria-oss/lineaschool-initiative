-- Убираем дубль Ирины Зинченко: #9 («Ирина», реальный Max-чат) + #7 («Ирина Зинченко», запись из CRM с телефоном и tg)
-- Переносим сообщения из дубля #9 в основной диалог #7
UPDATE interaction_messages SET dialog_id = 7 WHERE dialog_id = 9;

-- Переносим в основной диалог реальные Max-идентификаторы из дубля,
-- чтобы входящие из Max попадали сюда, и не теряем непрочитанные и время
UPDATE interaction_dialogs
SET max_chat_id = COALESCE(max_chat_id, (SELECT max_chat_id FROM interaction_dialogs WHERE id = 9)),
    max_user_id = COALESCE(max_user_id, (SELECT max_user_id FROM interaction_dialogs WHERE id = 9)),
    unread = unread + (SELECT unread FROM interaction_dialogs WHERE id = 9),
    last_time = GREATEST(last_time, (SELECT last_time FROM interaction_dialogs WHERE id = 9))
WHERE id = 7;

-- Прячем дубль
UPDATE interaction_dialogs SET hidden = true WHERE id = 9;
