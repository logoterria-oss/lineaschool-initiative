-- Update welcome and error messages to remove parent name requirement
UPDATE t_p93118852_lineaschool_initiati.bot_messages 
SET message_text = '👋 Здравствуйте! Я бот для приёма диктантов.

Чтобы отправить диктант:
1. Отправьте имя ребёнка
2. Затем отправьте фото диктанта

Пример:
Петя Иванов
[затем отправляете фото]',
updated_at = CURRENT_TIMESTAMP
WHERE message_key = 'welcome';

UPDATE t_p93118852_lineaschool_initiati.bot_messages 
SET message_text = '❌ Пожалуйста, отправьте имя ребёнка',
updated_at = CURRENT_TIMESTAMP
WHERE message_key = 'error_missing_data';

UPDATE t_p93118852_lineaschool_initiati.bot_messages 
SET message_text = '❌ Сначала отправьте имя ребёнка. Используйте /start чтобы начать сначала.',
updated_at = CURRENT_TIMESTAMP
WHERE message_key = 'error_photo_no_caption';

UPDATE t_p93118852_lineaschool_initiati.bot_messages 
SET message_text = '✅ Диктант получен для {child_name}!',
updated_at = CURRENT_TIMESTAMP
WHERE message_key = 'success';
