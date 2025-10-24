-- Update welcome message for two-step flow
UPDATE t_p93118852_lineaschool_initiati.bot_messages 
SET message_text = '👋 Здравствуйте! Я бот для приёма диктантов.

Чтобы отправить диктант:
1. Отправьте имя родителя и ребёнка (каждое с новой строки)
2. После этого отправьте фото диктанта

Пример:
Иванова Мария
Петя Иванов
[затем отправляете фото]',
updated_at = CURRENT_TIMESTAMP
WHERE message_key = 'welcome';

-- Update error messages
UPDATE t_p93118852_lineaschool_initiati.bot_messages 
SET message_text = '❌ Пожалуйста, отправьте имя родителя и ребёнка (каждое с новой строки)',
updated_at = CURRENT_TIMESTAMP
WHERE message_key = 'error_missing_data';

UPDATE t_p93118852_lineaschool_initiati.bot_messages 
SET message_text = '❌ Сначала отправьте имя родителя и ребёнка. Используйте /start чтобы начать сначала.',
updated_at = CURRENT_TIMESTAMP
WHERE message_key = 'error_photo_no_caption';
