-- Скрываем тестовые диалоги, созданные при проверке бронирования
UPDATE t_p93118852_lineaschool_initiati.interaction_dialogs
SET hidden = true, unread = 0
WHERE phone IN ('79991234567', '79995558877');
