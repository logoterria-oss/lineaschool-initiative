'''
Business: Process diagnostic booking leads and initiate WhatsApp conversation via AI
Args: event with body containing name, email, phone, date, time
Returns: Success response after saving to DB and sending WhatsApp message
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def send_whatsapp_message(phone: str, message: str) -> bool:
    instance_id = os.environ.get('GREENAPI_INSTANCE_ID')
    api_token = os.environ.get('GREENAPI_API_TOKEN')
    
    if not instance_id or not api_token:
        print('WhatsApp credentials not configured')
        return False
    
    clean_phone = ''.join(filter(str.isdigit, phone))
    if not clean_phone.startswith('7'):
        clean_phone = '7' + clean_phone
    
    chat_id = f'{clean_phone}@c.us'
    
    url = f'https://api.green-api.com/waInstance{instance_id}/sendMessage/{api_token}'
    
    try:
        print(f'Sending WhatsApp to {chat_id}')
        response = requests.post(url, json={
            'chatId': chat_id,
            'message': message
        }, timeout=10)
        
        print(f'GreenAPI response status: {response.status_code}')
        print(f'GreenAPI response body: {response.text}')
        
        if response.status_code == 200:
            response_data = response.json()
            print(f'WhatsApp message sent successfully: {response_data}')
            return True
        else:
            print(f'WhatsApp API error: {response.status_code} - {response.text}')
            return False
    except Exception as e:
        print(f'WhatsApp sending failed: {str(e)}')
        return False

def send_telegram_notification(name: str, email: str, phone: str, date: str, time: str):
    bot_token = os.environ.get('TELEGRAM_BOT_API_TOKEN')
    chat_id = '1112267464'
    
    if not bot_token:
        return
    
    message = f"🎓 Новая запись на диагностику:\n\n👤 Имя: {name}\n📧 E-mail: {email}\n📱 Телефон: {phone}\n📅 Дата: {date}\n🕐 Время: {time}"
    
    try:
        requests.post(
            f'https://api.telegram.org/bot{bot_token}/sendMessage',
            json={'chat_id': chat_id, 'text': message},
            timeout=5
        )
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
        
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Database not configured'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute(
            """INSERT INTO conversations (telegram_user_id, first_name, telegram_username, status, assigned_to, lead_data)
               VALUES (%s, %s, %s, 'active', 'ai', %s) RETURNING id""",
            (0, name, phone, json.dumps({
                'email': email,
                'phone': phone,
                'requested_date': date,
                'requested_time': time,
                'source': 'website_booking'
            }))
        )
        conversation_id = cur.fetchone()[0]
        
        first_message = "Здравствуйте! Меня зовут Виктория. Пишу вам из онлайн-школы коррекции дислексии и дисграфии LineaSchool. Расскажите поподробнее про вашу проблему"
        
        cur.execute(
            "INSERT INTO messages (conversation_id, sender, message_text) VALUES (%s, %s, %s)",
            (conversation_id, 'ai', first_message)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        send_whatsapp_message(phone, first_message)
        
        send_telegram_notification(name, email, phone, date, time)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'conversation_id': conversation_id}),
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