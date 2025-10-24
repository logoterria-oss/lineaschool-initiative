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
        
        # Обработка команды /start
        if text == '/start':
            welcome_msg = bot_messages.get('welcome', 'Привет!')
            send_telegram_message(chat_id, welcome_msg)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        # Обработка фото с подписью
        if photo and text:
            lines = text.strip().split('\n')
            
            if len(lines) < 2:
                send_telegram_message(chat_id, bot_messages.get('error_missing_data', '❌ Ошибка'))
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'ok': True}),
                    'isBase64Encoded': False
                }
            
            parent_name = lines[0].strip()
            child_name = lines[1].strip()
            
            # Берём последнее фото (самое большое)
            largest_photo = photo[-1]
            file_id = largest_photo['file_id']
            
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
                            (user_id, username, parent_name, child_name, file_id)
                        )
                        conn.commit()
                
                success_msg = bot_messages.get('success', '✅ Диктант получен!')
                success_msg = success_msg.replace('{parent_name}', parent_name).replace('{child_name}', child_name)
                send_telegram_message(chat_id, success_msg)
                print(f'Saved dictation: parent={parent_name}, child={child_name}, file_id={file_id}')
                
            except Exception as db_error:
                print(f'Database error: {str(db_error)}')
                send_telegram_message(chat_id, bot_messages.get('error_db', '❌ Ошибка'))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        # Если прислали только текст или только фото
        if photo and not text:
            send_telegram_message(chat_id, bot_messages.get('error_photo_no_caption', '❌ Ошибка'))
        elif text and not photo:
            send_telegram_message(chat_id, bot_messages.get('error_no_photo', '❌ Ошибка'))
        
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