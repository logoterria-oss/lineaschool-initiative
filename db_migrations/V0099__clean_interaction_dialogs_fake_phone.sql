-- В phone попал chat_id из MAX (не телефон). Чистим всё, что не 11-значный номер.
UPDATE interaction_dialogs
SET phone = NULL
WHERE phone IS NOT NULL AND phone !~ '^[0-9]{11}$';