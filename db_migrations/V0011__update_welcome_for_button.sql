-- Update welcome message to be shorter for button interface
UPDATE t_p93118852_lineaschool_initiati.bot_messages 
SET message_text = '👋 Здравствуйте! Я бот для проверки диктантов.

Нажмите кнопку ниже, чтобы отправить диктант на проверку.',
updated_at = CURRENT_TIMESTAMP
WHERE message_key = 'welcome';
