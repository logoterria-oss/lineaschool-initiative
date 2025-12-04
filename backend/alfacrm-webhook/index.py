import json
import os
from typing import Dict, Any
import urllib.request
import urllib.error


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Webhook для получения уведомлений о новых лидах от AlfaCRM
    Отправляет уведомление в Telegram при создании нового лида
    '''
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
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Получаем данные от AlfaCRM
    body_data = json.loads(event.get('body', '{}'))
    
    print(f'Received webhook from AlfaCRM: {json.dumps(body_data, ensure_ascii=False)}')
    
    # Извлекаем данные лида
    lead_data = body_data.get('data', {})
    
    # Формируем сообщение для Telegram
    name = lead_data.get('name', 'Не указано')
    phone = lead_data.get('phone', 'Не указано')
    email = lead_data.get('email', 'Не указано')
    comment = lead_data.get('comment', '')
    custom_fields = lead_data.get('custom_fields', {})
    
    message = f"🎓 Новая запись на диагностику из AlfaCRM:\n\n"
    message += f"👤 Имя: {name}\n"
    message += f"📱 Телефон: {phone}\n"
    
    if email and email != 'Не указано':
        message += f"✉️ Email: {email}\n"
    
    if comment:
        message += f"💬 Комментарий: {comment}\n"
    
    # Добавляем кастомные поля если есть
    if custom_fields:
        message += f"\n📋 Дополнительные данные:\n"
        for key, value in custom_fields.items():
            message += f"  • {key}: {value}\n"
    
    # Отправляем в Telegram
    telegram_bot_token = os.environ.get('TELEGRAM_LEADS_BOT_TOKEN', '8320634391:AAGxRCQdt_K-L5QliSLX9vDJmqhLlubfpB8')
    chat_id = '1112267464'
    
    telegram_url = f'https://api.telegram.org/bot{telegram_bot_token}/sendMessage'
    telegram_data = json.dumps({
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML'
    }).encode('utf-8')
    
    try:
        req = urllib.request.Request(
            telegram_url,
            data=telegram_data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req) as response:
            response_body = response.read().decode('utf-8')
            print(f'Telegram notification sent: {response_body}')
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Webhook processed successfully'
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error sending Telegram notification: {str(e)}')
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Webhook received but notification failed',
                'error': str(e)
            }),
            'isBase64Encoded': False
        }
