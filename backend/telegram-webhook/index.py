'''
Business: Webhook для приёма сообщений от Telegram бота с диктантами
Args: event with body - Telegram update object
Returns: HTTP 200 для подтверждения получения
'''
import json
import os
from typing import Dict, Any
import urllib.request
import urllib.parse

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_str = event.get('body', '{}')
        update = json.loads(body_str)
        
        print(f'Received Telegram update: {json.dumps(update)}')
        
        message = update.get('message')
        if not message:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        chat_id = message.get('chat', {}).get('id')
        user_id = message.get('from', {}).get('id')
        username = message.get('from', {}).get('username', '')
        text = message.get('text', '')
        photo = message.get('photo')
        
        # Получаем DSN из переменных окружения
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            print('ERROR: DATABASE_URL not configured')
            send_telegram_message(chat_id, '❌ Ошибка конфигурации. Обратитесь к администратору.')
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        # Импортируем psycopg после получения DSN
        import psycopg
        
        # Получаем тексты сообщений из БД
        bot_messages = get_bot_messages(dsn)
        
        # Получаем или создаём сессию пользователя
        session = get_or_create_session(dsn, user_id, username)
        
        # Если это новый пользователь - приветствуем
        if session.get('is_new_user'):
            welcome_msg = bot_messages.get('welcome', 'Здравствуйте! Я бот для проверки диктантов.')
            send_telegram_message(chat_id, welcome_msg)
            send_telegram_message(chat_id, 'Отправьте ФИО ребёнка:')
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        # Обработка /start или /restart - сброс сессии
        if text == '/start' or text == '/restart':
            reset_session(dsn, user_id)
            welcome_msg = bot_messages.get('welcome', 'Привет!')
            send_telegram_message(chat_id, welcome_msg)
            send_telegram_message(chat_id, 'Отправьте ФИО ребёнка:')
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        # Если пришло фото
        if photo:
            # Берём последнее фото (самое большое)
            largest_photo = photo[-1]
            file_id = largest_photo['file_id']
            
            # Получаем имя из сессии
            child_name = session.get('child_name')
            
            # Если имени нет - просим отправить
            if not child_name:
                send_telegram_message(chat_id, '❌ Сначала отправьте ФИО ребёнка. Используйте /start чтобы начать сначала.')
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'ok': True}),
                    'isBase64Encoded': False
                }
            
            # Сохраняем в БД
            try:
                with psycopg.connect(dsn) as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            INSERT INTO t_p93118852_lineaschool_initiati.dictations 
                            (telegram_user_id, telegram_username, parent_name, child_name, photo_file_id, status)
                            VALUES (%s, %s, %s, %s, %s, 'pending')
                            """,
                            (user_id, username, username, child_name, file_id)
                        )
                        conn.commit()
                
                success_msg = bot_messages.get('success', '✅ Диктант получен!')
                success_msg = success_msg.replace('{child_name}', child_name)
                send_telegram_message(chat_id, success_msg)
                print(f'Saved dictation: child={child_name}, file_id={file_id}')
                
                # Сбрасываем сессию после успешной отправки
                reset_session(dsn, user_id)
                
            except Exception as db_error:
                print(f'Database error: {str(db_error)}')
                send_telegram_message(chat_id, bot_messages.get('error_db', '❌ Ошибка'))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        # Обработка текстового сообщения - это имя ребёнка
        if text and not photo:
            child_name = text.strip()
            
            if child_name:
                # Сохраняем имя в сессию
                update_session(dsn, user_id, username, child_name)
                
                msg = f'✅ ФИО ребёнка сохранено: {child_name}\n\nТеперь отправьте фото диктанта.'
                send_telegram_message(chat_id, msg)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'ok': True}),
                    'isBase64Encoded': False
                }
            
            # Если пустое сообщение - подсказываем
            send_telegram_message(chat_id, bot_messages.get('error_missing_data', '❌ Пожалуйста, отправьте ФИО ребёнка'))
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f'Error processing webhook: {str(e)}')
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }

def get_or_create_session(dsn: str, user_id: int, username: str) -> dict:
    """Получает или создаёт сессию пользователя"""
    import psycopg
    
    try:
        with psycopg.connect(dsn) as conn:
            with conn.cursor() as cur:
                # Проверяем, существует ли сессия
                cur.execute(
                    """
                    SELECT state, child_name FROM t_p93118852_lineaschool_initiati.bot_sessions
                    WHERE telegram_user_id = %s
                    """,
                    (user_id,)
                )
                existing = cur.fetchone()
                is_new_user = existing is None
                
                # Создаём или обновляем сессию
                cur.execute(
                    """
                    INSERT INTO t_p93118852_lineaschool_initiati.bot_sessions 
                    (telegram_user_id, telegram_username, state)
                    VALUES (%s, %s, 'idle')
                    ON CONFLICT (telegram_user_id) 
                    DO UPDATE SET updated_at = CURRENT_TIMESTAMP
                    RETURNING state, child_name
                    """,
                    (user_id, username)
                )
                row = cur.fetchone()
                conn.commit()
                
                return {
                    'state': row[0] if row else 'idle',
                    'child_name': row[1] if row and row[1] else None,
                    'is_new_user': is_new_user
                }
    except Exception as e:
        print(f'Error getting session: {str(e)}')
        return {'state': 'idle', 'parent_name': None, 'child_name': None, 'is_new_user': False}

def update_session(dsn: str, user_id: int, parent_name: str, child_name: str):
    """Обновляет данные в сессии"""
    import psycopg
    
    try:
        with psycopg.connect(dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE t_p93118852_lineaschool_initiati.bot_sessions
                    SET parent_name = %s, child_name = %s, state = 'waiting_photo', updated_at = CURRENT_TIMESTAMP
                    WHERE telegram_user_id = %s
                    """,
                    (parent_name, child_name, user_id)
                )
                conn.commit()
    except Exception as e:
        print(f'Error updating session: {str(e)}')

def reset_session(dsn: str, user_id: int):
    """Сбрасывает сессию пользователя"""
    import psycopg
    
    try:
        with psycopg.connect(dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE t_p93118852_lineaschool_initiati.bot_sessions
                    SET child_name = NULL, state = 'idle', updated_at = CURRENT_TIMESTAMP
                    WHERE telegram_user_id = %s
                    """,
                    (user_id,)
                )
                conn.commit()
    except Exception as e:
        print(f'Error resetting session: {str(e)}')

def get_bot_messages(dsn: str) -> dict:
    """Получает тексты сообщений из БД"""
    import psycopg
    
    try:
        with psycopg.connect(dsn) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT message_key, message_text 
                    FROM t_p93118852_lineaschool_initiati.bot_messages
                    """
                )
                rows = cur.fetchall()
                return {row[0]: row[1] for row in rows}
    except Exception as e:
        print(f'Error loading bot messages: {str(e)}')
        return {}

def send_telegram_message(chat_id: int, text: str):
    """Отправляет сообщение в Telegram"""
    bot_token = os.environ.get('TELEGRAM_BOT_API_TOKEN')
    if not bot_token:
        print('ERROR: TELEGRAM_BOT_API_TOKEN not configured')
        return
    
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f'Sent message to {chat_id}: {result.get("ok")}')
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f'Error sending Telegram message: {e.code} {e.reason}')
        print(f'Response body: {error_body}')
    except Exception as e:
        print(f'Error sending Telegram message: {str(e)}')

def send_telegram_message_with_button(chat_id: int, text: str):
    """Отправляет сообщение с кнопкой ПРОВЕРКА ДИКТАНТА"""
    bot_token = os.environ.get('TELEGRAM_BOT_API_TOKEN')
    if not bot_token:
        print('ERROR: TELEGRAM_BOT_API_TOKEN not configured')
        return
    
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'reply_markup': {
            'inline_keyboard': [[
                {'text': 'ПРОВЕРКА ДИКТАНТА', 'callback_data': 'start_check'}
            ]]
        }
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f'Sent message with button to {chat_id}: {result.get("ok")}')
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f'Error sending Telegram message: {e.code} {e.reason}')
        print(f'Response body: {error_body}')
    except Exception as e:
        print(f'Error sending Telegram message: {str(e)}')

def answer_callback_query(callback_query_id: str):
    """Подтверждает получение callback от inline-кнопки"""
    bot_token = os.environ.get('TELEGRAM_BOT_API_TOKEN')
    if not bot_token:
        return
    
    url = f'https://api.telegram.org/bot{bot_token}/answerCallbackQuery'
    data = {'callback_query_id': callback_query_id}
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req)
    except Exception as e:
        print(f'Error answering callback: {str(e)}')