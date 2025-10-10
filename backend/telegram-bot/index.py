'''
Business: Telegram bot webhook for receiving dictations from parents
Args: event with httpMethod, body (Telegram update JSON)
Returns: HTTP response 200 OK
'''
import json
import os
from typing import Dict, Any
import urllib.request
import urllib.parse
import psycopg2

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
    
    bot_token = '8377726959:AAEsXjUKI0eDwImLzsNMTqHo8Hr4VyX3b_4'
    db_url = os.environ.get('DATABASE_URL')
    
    try:
        update = json.loads(event.get('body', '{}'))
        print(f'Received update: {json.dumps(update)}')
        
        message = update.get('message', {})
        chat_id = message.get('chat', {}).get('id')
        user_id = message.get('from', {}).get('id')
        username = message.get('from', {}).get('username', '')
        text = message.get('text', '')
        photo = message.get('photo', [])
        
        if text == '/start':
            send_message(bot_token, chat_id, 
                'Привет! 👋\n\n'
                'Я бот для приёма диктантов LineaSchool.\n\n'
                'Чтобы отправить диктант:\n'
                '1. Напишите ФИ ребёнка\n'
                '2. Прикрепите фото диктанта\n\n'
                'Наши диагносты проверят работу и свяжутся с вами!'
            )
            return success_response()
        
        if photo:
            caption = message.get('caption', '').strip()
            
            if not caption:
                send_message(bot_token, chat_id, 
                    '❌ Пожалуйста, укажите ФИ ребёнка в подписи к фото.\n\n'
                    'Пример: отправьте фото с текстом "Иванов Петр"'
                )
                return success_response()
            
            largest_photo = max(photo, key=lambda p: p.get('file_size', 0))
            file_id = largest_photo.get('file_id')
            
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            
            cur.execute(
                "INSERT INTO t_p93118852_lineaschool_initiati.dictations "
                "(telegram_user_id, telegram_username, child_name, photo_file_id, status) "
                "VALUES (%s, %s, %s, %s, 'pending')",
                (user_id, username, caption, file_id)
            )
            conn.commit()
            cur.close()
            conn.close()
            
            send_message(bot_token, chat_id,
                f'✅ Диктант для {caption} получен!\n\n'
                'Спасибо! Наши диагносты проверят работу в ближайшее время.'
            )
            
            return success_response()
        
        if text and text != '/start':
            send_message(bot_token, chat_id,
                'Отлично! Теперь прикрепите фото диктанта.\n\n'
                'В подписи к фото укажите ФИ ребёнка.'
            )
            return success_response()
        
        return success_response()
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }

def send_message(bot_token: str, chat_id: int, text: str):
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = {
        'chat_id': chat_id,
        'text': text
    }
    
    print(f'Sending to Telegram: {url}')
    print(f'Data: {json.dumps(data)}')
    
    req_data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            print(f'Telegram response: {json.dumps(result)}')
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f'Telegram API error: {e.code} - {error_body}')
        raise

def success_response():
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'ok': True}),
        'isBase64Encoded': False
    }