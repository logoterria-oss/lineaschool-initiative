import json
import urllib.request
import urllib.parse
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Webhook для приёма данных из АльфаCRM и отправки в Telegram
    '''
    method: str = event.get('httpMethod', 'POST')
    
    # Handle CORS
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
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Парсим данные от АльфаCRM
    body_data = json.loads(event.get('body', '{}'))
    
    # Формируем сообщение для Telegram
    child_name = body_data.get('customer_name', '')
    child_birth_date = body_data.get('birth_date', '')
    parent_name = body_data.get('parent_name', '')
    phone = body_data.get('phone', '')
    telegram_username = body_data.get('telegram', '')
    
    message = f"""🎓 Новая запись на диагностику:

👶 ФИО ребенка: {child_name}
🎂 Дата рождения ребенка: {child_birth_date}
👤 ФИО родителя: {parent_name}
📱 Телефон: {phone}
✈️ Telegram: {telegram_username}"""
    
    # Отправляем в Telegram
    telegram_token = '8320634391:AAGxRCQdt_K-L5QliSLX9vDJmqhLlubfpB8'
    chat_id = '1112267464'
    
    telegram_url = f'https://api.telegram.org/bot{telegram_token}/sendMessage'
    telegram_data = {
        'chat_id': chat_id,
        'text': message,
        'parse_mode': 'HTML'
    }
    
    req = urllib.request.Request(
        telegram_url,
        data=json.dumps(telegram_data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            response.read()
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }
