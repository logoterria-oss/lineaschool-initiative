-- Create table for bot message templates
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.bot_messages (
    id SERIAL PRIMARY KEY,
    message_key VARCHAR(100) UNIQUE NOT NULL,
    message_text TEXT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default messages
INSERT INTO t_p93118852_lineaschool_initiati.bot_messages (message_key, message_text, description) VALUES
('welcome', '👋 Здравствуйте! Я бот для приёма диктантов.

Чтобы отправить диктант, пришлите:
1. Имя родителя
2. Имя ребёнка
3. Фото диктанта

Пример:
Иванова Мария
Петя Иванов
[фото]', 'Приветственное сообщение /start'),

('success', '✅ Диктант получен!

Родитель: {parent_name}
Ребёнок: {child_name}

Ожидайте проверки.', 'Сообщение об успешной отправке'),

('error_no_caption', '❌ Пожалуйста, укажите имя родителя и имя ребёнка в подписи к фото.', 'Ошибка: нет подписи'),

('error_missing_data', '❌ Пожалуйста, укажите имя родителя и имя ребёнка в подписи к фото.', 'Ошибка: неполные данные'),

('error_no_photo', '❌ Пожалуйста, прикрепите фото диктанта.', 'Ошибка: нет фото'),

('error_photo_no_caption', '❌ Пожалуйста, добавьте подпись к фото с именем родителя и ребёнка.', 'Ошибка: фото без подписи'),

('error_db', '❌ Ошибка при сохранении. Попробуйте позже.', 'Ошибка базы данных'),

('error_config', '❌ Ошибка конфигурации. Обратитесь к администратору.', 'Ошибка конфигурации');
