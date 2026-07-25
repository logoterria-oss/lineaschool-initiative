-- Объединяем задвоенный чат Виктории: скрытый TG-дубль #4 в основной чат #1
UPDATE interaction_messages SET dialog_id = 1 WHERE dialog_id = 4;

UPDATE interaction_dialogs d
SET unread = d.unread + COALESCE((SELECT unread FROM interaction_dialogs WHERE id = 4), 0),
    last_time = GREATEST(d.last_time, (SELECT last_time FROM interaction_dialogs WHERE id = 4)),
    tg_username = COALESCE(d.tg_username, (SELECT tg_username FROM interaction_dialogs WHERE id = 4))
WHERE d.id = 1;

UPDATE interaction_dialogs
SET hidden = true, unread = 0, tg_chat_id = NULL, tg_username = NULL, phone = NULL
WHERE id = 4;