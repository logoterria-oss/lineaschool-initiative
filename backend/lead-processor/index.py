'''
Business: Process diagnostic booking leads, send to AlfaCRM and Telegram notification
Args: event with body containing name, email, phone, date, time
Returns: Success response after sending to CRM and notification
'''
import json
import os
from typing import Dict, Any, Optional
import requests
from telegram_send import notify_all, get_recent_chats, bot_info

# Боты проекта: короткое имя -> переменная с токеном
TG_BOTS = {
    'leads': 'TELEGRAM_LEADS_BOT_TOKEN',
    'payment': 'TELEGRAM_PAYMENT_BOT_TOKEN',
    'questionnaire': 'TELEGRAM_QUESTIONNAIRE_BOT_TOKEN',
}

# Администраторы, которым дублируем уведомления помимо основного чата.
# Chat ID берётся из ?action=recent-chats после того, как человек
# написал боту хотя бы одно сообщение.
EXTRA_ADMIN_CHAT_IDS = [
    '976372702',
    '1010916517',  # Анна Хорунжева (@amarrela)
]


def recipients() -> list:
    """Кому шлём уведомления: основной чат + дополнительные администраторы."""
    main = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
    return [rid for rid in [main, *EXTRA_ADMIN_CHAT_IDS] if rid]


def save_lead_to_db(parent_name: str, student_name: str, contact: str,
                    messengers: list = None, telegram: str = ''):
    """Сохраняет новую заявку в таблицу leads (для раздела 'Список лидов')."""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        print('DATABASE_URL not set - skip saving lead to db')
        return
    try:
        import psycopg2
        from datetime import datetime
        contact_parts = [c for c in [contact, telegram] if c]
        if messengers:
            contact_parts.append('(' + ', '.join(messengers) + ')')
        contact_full = ' '.join(contact_parts)
        req_date = datetime.now().strftime('%d.%m')

        def esc(v):
            return (str(v) if v is not None else '').replace("'", "''")

        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO leads (parent_name, student_name, contact, request_date, source) "
            f"VALUES ('{esc(parent_name)}', '{esc(student_name)}', '{esc(contact_full)}', "
            f"'{esc(req_date)}', 'site')"
        )
        cur.close()
        conn.close()
        print('✅ Lead saved to db')
    except Exception as e:
        print(f'Failed to save lead to db: {str(e)}')

def send_to_alfacrm(name: str, phone: str, email: str = '', note: str = '', 
                    dob: str = '', telegram: str = '', parent_name: str = '') -> Optional[Dict]:
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
        
        # Шаг 2: Создание лида через customer/create
        lead_url = 'https://11086.s20.online/v2api/1/customer/create'
        headers = {
            'X-ALFACRM-TOKEN': token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        # Формируем данные для создания лида (клиента без статуса студента)
        lead_data = {
            'name': name,  # ФИО ребенка
            'phone': [phone],  # Телефон родителя
            'branch_ids': [1],  # Филиалы
            'is_study': 0,  # 0 = лид (не студент)
            'legal_type': 1  # 1 = физическое лицо
        }
        
        # Дата рождения ребенка (оставляем формат DD.MM.YYYY)
        if dob:
            lead_data['dob'] = dob
        
        # Email родителя
        if email:
            lead_data['email'] = [email]
        
        # Telegram username
        if telegram:
            # Убираем @ если есть
            clean_telegram = telegram.replace('@', '')
            lead_data['im'] = [clean_telegram]  # Telegram в контакты
        
        # Заказчик (ФИО родителя) - сохраняем в legal_name
        if parent_name:
            lead_data['legal_name'] = parent_name
        
        # Примечание
        if note:
            lead_data['note'] = note
        
        print(f'Creating lead: {lead_url}')
        print(f'Lead data: {lead_data}')
        
        lead_response = requests.post(lead_url, json=lead_data, headers=headers, timeout=10)
        print(f'Lead creation response: {lead_response.status_code}')
        
        try:
            response_json = lead_response.json()
            print(f'Response JSON: {response_json}')
            
            if lead_response.status_code in [200, 201]:
                # AlfaCRM возвращает success, errors, model
                if response_json.get('success'):
                    model = response_json.get('model', {})
                    lead_id = model.get('id')
                    print(f'✅ Lead created in AlfaCRM: ID {lead_id}')
                    return model
                else:
                    errors = response_json.get('errors', {})
                    print(f'❌ AlfaCRM returned errors: {errors}')
                    return None
            else:
                print(f'❌ Failed to create lead: {response_json}')
                return None
        except Exception as e:
            print(f'❌ Failed to parse response: {lead_response.text[:500]}')
            print(f'Error: {str(e)}')
            return None
            
    except Exception as e:
        print(f'AlfaCRM integration error: {str(e)}')
        return None

def send_telegram_notification(child_name: str, parent_name: str, child_birth_date: str, 
                               telegram: str, phone: str, email: str = '', 
                               date: str = '', time: str = '', messengers: list = None):
    bot_token = os.environ.get('TELEGRAM_LEADS_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
    
    print(f'=== TELEGRAM NOTIFICATION ===')
    print(f'Bot token configured: {bool(bot_token)}, length: {len(bot_token) if bot_token else 0}')
    print(f'Chat ID: {chat_id}')
    
    if not bot_token:
        print('No bot token configured')
        return
    
    if not chat_id:
        print('No chat_id configured - skipping notification')
        return
    
    # Формируем сообщение с полными данными
    message_parts = ["🎓 Новая запись на диагностику:"]
    
    if child_name:
        message_parts.append(f"\n👶 ФИО ребенка: {child_name}")
    if child_birth_date:
        message_parts.append(f"\n🎂 Дата рождения ребенка: {child_birth_date}")
    if parent_name:
        message_parts.append(f"\n👤 ФИО родителя: {parent_name}")
    if email:
        message_parts.append(f"\n📧 E-mail: {email}")
    if phone:
        message_parts.append(f"\n📱 Телефон: {phone}")
    if messengers:
        message_parts.append(f"\n💬 Мессенджеры: {', '.join(messengers)}")
    if telegram:
        message_parts.append(f"\n✈️ Telegram: {telegram}")
    if date:
        message_parts.append(f"\n📅 Дата: {date}")
    if time:
        message_parts.append(f"\n🕐 Время: {time}")
    
    message = ''.join(message_parts)
    
    recipient_ids = recipients()
    # Отправляем через перебор адресов Telegram: DNS отдаёт несколько IP,
    # и часть из них с площадки функций недоступна (соединение виснет).
    # Раньше из-за этого терялось примерно 9 уведомлений из 10.
    results = notify_all(bot_token, recipient_ids, message)
    print(f'Telegram delivery: {results}')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    print(f'=== INCOMING REQUEST ===')
    print(f'Method: {event.get("httpMethod")}')
    print(f'Body: {event.get("body", "")[:500]}')
    print(f'Headers: {json.dumps({k: v for k, v in (event.get("headers") or {}).items() if k.lower() in ["content-type", "origin", "referer"]})}')
    
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
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        # Кто недавно писал боту — чтобы узнать chat_id нового администратора
        if params.get('action') == 'recent-chats':
            token_env = TG_BOTS.get(params.get('bot') or 'payment')
            token = os.environ.get(token_env or '')
            chats = get_recent_chats(token) if token else []
            info = bot_info(token) if token else {}
            me = (info.get('me') or {})
            hook = (info.get('webhook') or {})
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'chats': chats,
                    'bot_username': me.get('username'),
                    'webhook_url': hook.get('url') or '',
                    'current_recipients': recipients(),
                }, ensure_ascii=False),
            }

        # Точечная проверка одного бота: кому и как доставилось
        if params.get('action') == 'test-bot':
            token_env = TG_BOTS.get(params.get('bot') or 'questionnaire')
            token = os.environ.get(token_env or '')
            if not token:
                return {'statusCode': 200,
                        'headers': {'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'no token'})}
            info = bot_info(token)
            me = info.get('me') or {}
            hook = info.get('webhook') or {}
            targets = [params['chat']] if params.get('chat') else recipients()
            sends = notify_all(token, targets, 'Проверка связи.', timeout=3.0)
            return {'statusCode': 200,
                    'headers': {'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'bot_username': me.get('username'),
                        'webhook_url': hook.get('url') or '',
                        'sends': sends,
                    }, ensure_ascii=False)}

        # Быстрая проверка ботов: шлём тестовое сообщение тем же надёжным
        # способом, что и боевые уведомления, чтобы результат совпадал
        # с реальной доставкой. Таймауты короткие — лимит функции 5 секунд.
        recipient_ids = recipients()

        results = {'bots': {}}
        for bot_name, token_env in (
            ('Лиды', 'TELEGRAM_LEADS_BOT_TOKEN'),
            ('Оплаты', 'TELEGRAM_PAYMENT_BOT_TOKEN'),
            ('Анкеты', 'TELEGRAM_QUESTIONNAIRE_BOT_TOKEN'),
        ):
            token = os.environ.get(token_env)
            if not token:
                results['bots'][bot_name] = {'token_present': False, 'sends': {}}
                continue
            sends = notify_all(
                token, recipient_ids,
                f'Проверка связи: бот «{bot_name}» работает.',
                timeout=1.2,
            )
            results['bots'][bot_name] = {'token_present': True, 'sends': sends}

        print(f'TG debug results: {json.dumps(results, ensure_ascii=False)}')
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(results, ensure_ascii=False)}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        
        # Получаем данные из запроса
        # Поддерживаем оба формата: старый (name) и новый (childName, parentName)
        child_name = body_data.get('childName', '')
        parent_name = body_data.get('parentName', body_data.get('name', ''))
        child_birth_date = body_data.get('childBirthDate', '')
        telegram_username = body_data.get('telegram', '')
        messengers = body_data.get('messengers', [])
        
        email = body_data.get('email', '')
        phone = body_data.get('phone', '')
        date = body_data.get('date', '')
        time = body_data.get('time', '')
        custom_note = body_data.get('note', '')
        
        # Проверяем обязательные поля
        if not phone:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Phone is required'}),
                'isBase64Encoded': False
            }
        
        # Определяем, что записывать в имя лида в CRM
        crm_lead_name = child_name if child_name else parent_name
        
        if not crm_lead_name:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Child name or parent name is required'}),
                'isBase64Encoded': False
            }
        
        # Формируем примечание для CRM
        note_parts = []
        if parent_name and child_name:
            note_parts.append(f'ФИО родителя: {parent_name}')
        if child_birth_date:
            note_parts.append(f'Дата рождения ребенка: {child_birth_date}')
        if messengers:
            note_parts.append(f'Мессенджеры: {", ".join(messengers)}')
        if telegram_username:
            note_parts.append(f'Telegram: {telegram_username}')
        if date and time:
            note_parts.append(f'Запись на диагностику: {date} в {time}')
        if custom_note:
            note_parts.append(custom_note)
        
        crm_note = '\n'.join(note_parts) if note_parts else 'Заявка с сайта'
        
        # Отправка в AlfaCRM
        print(f'📤 Отправка лида в AlfaCRM')
        print(f'Lead name: {crm_lead_name}, DOB: {child_birth_date}, Telegram: {telegram_username}')
        crm_result = send_to_alfacrm(
            name=crm_lead_name,
            phone=phone,
            email=email,
            note=crm_note,
            dob=child_birth_date,
            telegram=telegram_username,
            parent_name=parent_name
        )
        
        # Сохранение в таблицу лидов (раздел 'Список лидов' у руководителя)
        save_lead_to_db(
            parent_name=parent_name,
            student_name=child_name,
            contact=phone,
            messengers=messengers,
            telegram=telegram_username,
        )

        # Отправка в Telegram. Никогда не роняем запрос из-за проблем с Telegram:
        # заявка уже сохранена в CRM и в БД, поэтому уведомление — best effort.
        print(f'📨 Отправка уведомления в Telegram')
        try:
            send_telegram_notification(
                child_name=child_name,
                parent_name=parent_name,
                child_birth_date=child_birth_date,
                telegram=telegram_username,
                phone=phone,
                email=email,
                date=date,
                time=time,
                messengers=messengers
            )
        except Exception as tg_err:
            print(f'Telegram notification skipped due to error: {str(tg_err)}')
        
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