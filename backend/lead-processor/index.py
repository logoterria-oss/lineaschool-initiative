'''
Business: Process diagnostic booking leads and send Telegram notification
Args: event with body containing name, email, phone, date, time
Returns: Success response after sending notification
'''
import json
import os
from typing import Dict, Any
import requests

def send_telegram_notification(name: str, email: str, phone: str, date: str, time: str):
    bot_token = os.environ.get('TELEGRAM_LEADS_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
    
    print(f'=== TELEGRAM NOTIFICATION ===')
    print(f'Bot token exists: {bool(bot_token)}')
    print(f'Chat ID: {chat_id}')
    
    if not bot_token:
        print('No bot token configured')
        return
    
    if not chat_id:
        print('No chat_id configured - skipping notification')
        return
    
    message = f"🎓 Новая запись на диагностику:\n\n👤 Имя: {name}\n📧 E-mail: {email}\n📱 Телефон: {phone}\n📅 Дата: {date}\n🕐 Время: {time}"
    
    try:
        response = requests.post(
            f'https://api.telegram.org/bot{bot_token}/sendMessage',
            json={'chat_id': chat_id, 'text': message},
            timeout=5
        )
        print(f'Telegram response: {response.status_code} - {response.text}')
    except Exception as e:
        print(f'Telegram notification failed: {str(e)}')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'POST')
    
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
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        name = body_data.get('name', '')
        email = body_data.get('email', '')
        phone = body_data.get('phone', '')
        date = body_data.get('date', '')
        time = body_data.get('time', '')
        
        if not all([name, phone]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Name and phone are required'}),
                'isBase64Encoded': False
            }
        
        print(f'📨 Отправка уведомления в Telegram')
        send_telegram_notification(name, email, phone, date, time)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f'Error processing lead: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
