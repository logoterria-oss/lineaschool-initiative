'''
Business: Process diagnostic booking leads, send to AlfaCRM and Telegram notification
Args: event with body containing name, email, phone, date, time
Returns: Success response after sending to CRM and notification
'''
import json
import os
from typing import Dict, Any, Optional
import requests

def send_to_alfacrm(name: str, phone: str, email: str = '', note: str = '') -> Optional[Dict]:
    """Отправка лида в AlfaCRM через API"""
    
    crm_email = os.environ.get('ALFACRM_EMAIL')
    api_key = os.environ.get('ALFACRM_API_KEY')
    branch_id = os.environ.get('ALFACRM_BRANCH_ID', '1')
    
    print(f'=== ALFACRM INTEGRATION ===')
    print(f'Email configured: {bool(crm_email)}')
    print(f'API Key configured: {bool(api_key)}')
    print(f'Branch ID: {branch_id}')
    
    if not crm_email or not api_key:
        print('AlfaCRM credentials not configured - skipping CRM integration')
        return None
    
    try:
        # Шаг 1: Получение токена авторизации
        auth_url = 'https://11086.s20.online/v2api/auth/login'
        auth_data = {
            'email': crm_email,
            'api_key': api_key
        }
        
        print(f'Auth request to: {auth_url}')
        auth_response = requests.post(auth_url, json=auth_data, timeout=10)
        print(f'Auth response: {auth_response.status_code}')
        
        if auth_response.status_code != 200:
            print(f'Auth failed: {auth_response.text}')
            return None
        
        auth_result = auth_response.json()
        token = auth_result.get('token')
        
        if not token:
            print('No token received from AlfaCRM')
            return None
        
        print(f'Token received successfully')
        
        # Шаг 2: Получение списка филиалов для определения правильного ID
        branches_url = 'https://11086.s20.online/v2api/branch/index'
        headers = {
            'X-ALFACRM-TOKEN': token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        branches_response = requests.get(branches_url, headers=headers, timeout=10)
        print(f'Branches response: {branches_response.status_code}')
        
        if branches_response.status_code == 200:
            branches = branches_response.json()
            print(f'Available branches: {branches}')
            if branches and len(branches) > 0:
                actual_branch_id = branches[0].get('id', branch_id)
                print(f'Using branch ID: {actual_branch_id}')
            else:
                actual_branch_id = branch_id
        else:
            print(f'Failed to get branches, using default: {branch_id}')
            actual_branch_id = branch_id
        
        # Шаг 3: Создание лида
        lead_url = f'https://11086.s20.online/v2api/{actual_branch_id}/lead/create'
        lead_data = {
            'name': name,
            'phone': phone,
            'branch_id': int(actual_branch_id),
            'status_id': 1  # Статус "Основная"
        }
        
        if email:
            lead_data['email'] = email
        
        if note:
            lead_data['note'] = note
        
        print(f'Creating lead: {lead_url}')
        print(f'Lead data: {lead_data}')
        
        lead_response = requests.post(lead_url, json=lead_data, headers=headers, timeout=10)
        print(f'Lead creation response: {lead_response.status_code}')
        print(f'Response body: {lead_response.text[:500]}')
        
        if lead_response.status_code in [200, 201]:
            result = lead_response.json()
            print(f'✅ Lead created in AlfaCRM: ID {result.get("id")}')
            return result
        else:
            print(f'❌ Failed to create lead: {lead_response.text[:200]}')
            return None
            
    except Exception as e:
        print(f'AlfaCRM integration error: {str(e)}')
        return None

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
        
        # Отправка в AlfaCRM
        print(f'📤 Отправка лида в AlfaCRM')
        note = f'Запись на диагностику: {date} в {time}' if date and time else 'Заявка с сайта'
        crm_result = send_to_alfacrm(name, phone, email, note)
        
        # Отправка в Telegram
        print(f'📨 Отправка уведомления в Telegram')
        send_telegram_notification(name, email, phone, date, time)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'crm_status': 'created' if crm_result else 'skipped'
            }),
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