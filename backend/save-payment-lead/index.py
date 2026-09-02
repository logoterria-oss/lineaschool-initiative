'''
Business: Save payment lead contact information to database
Args: event with httpMethod, body (name, plan, amount, order_id)
Returns: HTTP response with success status
'''
import json
import os
import psycopg2
import urllib.request
from typing import Dict, Any
from crm_match import match_name
from telegram_send import notify_all

# Администраторы, которым дублируем уведомления помимо основного чата.
# Chat ID узнаём через lead-processor?action=recent-chats после того,
# как человек написал боту хотя бы одно сообщение.
EXTRA_ADMIN_CHAT_IDS = [
    '976372702',
    '1010916517',  # Анна Хорунжева (@amarrela)
]


def recipients() -> list:
    """Кому шлём уведомления: основной чат + дополнительные администраторы."""
    main = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
    return [rid for rid in [main, *EXTRA_ADMIN_CHAT_IDS] if rid]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
    
    # Parse request body
    body_data = json.loads(event.get('body', '{}'))
    name = body_data.get('name')
    plan = body_data.get('plan')
    amount = body_data.get('amount')
    order_id = body_data.get('order_id')

    # Подбираем карточку в AlfaCRM (для аналитики), но введённое родителем имя не теряем
    crm_name = match_name(name) if name else name

    print(f'Saving payment lead: {name} (CRM: {crm_name}), {plan}, {amount}, {order_id}')
    
    # Get database connection string
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        # Insert lead data (email and phone as empty strings for NOT NULL constraint)
        # Родитель мог обновить страницу оплаты — номер заказа тот же.
        # Повтор не считаем ошибкой: просто обновляем данные заявки.
        cur.execute(
            "INSERT INTO payment_leads (name, email, phone, plan, amount, order_id, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, NOW()) "
            "ON CONFLICT (order_id) DO UPDATE SET "
            "name = EXCLUDED.name, plan = EXCLUDED.plan, amount = EXCLUDED.amount",
            (crm_name, '', '', plan, amount, order_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f'Lead saved successfully: {order_id}')
        
        # Send Telegram notification
        chat_id = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
        bot_token = os.environ.get('TELEGRAM_PAYMENT_BOT_TOKEN')
        
        if chat_id and bot_token:
            # Отправляем перебором адресов Telegram: DNS отдаёт несколько IP,
            # и часть из них с площадки функций недоступна — соединение виснет
            # до таймаута, уведомление теряется. Раньше сбой первого получателя
            # ещё и обрывал отправку второму, так как цикл был в общем try.
            try:
                crm_line = f"\n🗂 В CRM: {crm_name}" if crm_name and crm_name != name else ''
                message = f"🔔 Клиент перешел на страницу оплаты!\n\n👤 Имя: {name}{crm_line}\n📦 Тариф: {plan}\n💵 Сумма: {amount}₽\n🔢 ID заказа: {order_id}"
                results = notify_all(bot_token, recipients(), message)
                print(f'Telegram delivery for order {order_id}: {results}')
            except Exception as tg_error:
                print(f'Telegram notification failed: {str(tg_error)}')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f'Database error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }