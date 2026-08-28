-- Диалог от тестовой брони «Другой Ребёнок» убираем из окна взаимодействия
UPDATE interaction_dialogs SET hidden = true, unread = 0
WHERE child_name = 'Другой Ребёнок' AND chat_id LIKE 'booking-%';