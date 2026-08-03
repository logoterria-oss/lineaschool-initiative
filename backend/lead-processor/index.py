'''
Business: Process diagnostic booking leads, send to AlfaCRM and Telegram notification
Args: event with body containing name, email, phone, date, time
Returns: Success response after sending to CRM and notification
'''
import json
import os
from typing import Dict, Any, Optional
import requests

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
    
    recipient_ids = [chat_id, '976372702']
    # Пробуем несколько хостов Telegram Bot API: если прямой api.telegram.org
    # недоступен с площадки функций, срабатывает зеркало. Общий бюджет времени
    # держим маленьким, чтобы функция не упала по лимиту 30 сек и не потеряла
    # уже сохранённую в CRM/БД заявку.
    hosts = ['https://api.telegram.org', 'https://api.telegram.org.']
    for recipient_id in recipient_ids:
        sent = False
        for host in hosts:
            try:
                response = requests.post(
                    f'{host}/bot{bot_token}/sendMessage',
                    json={'chat_id': recipient_id, 'text': message},
                    timeout=4
                )
                print(f'Telegram response to {recipient_id} via {host}: {response.status_code} - {response.text}')
                if response.status_code == 200:
                    sent = True
                    break
            except Exception as e:
                print(f'Telegram notification failed for {recipient_id} via {host}: {str(e)}')
        if not sent:
            print(f'Telegram notification NOT delivered to {recipient_id} (all hosts failed)')

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
        import time as _time
        from urllib.request import Request as URequest, urlopen as uopen
        from urllib.error import HTTPError as UHTTPError

        questionnaire_token = os.environ.get('TELEGRAM_QUESTIONNAIRE_BOT_TOKEN')
        leads_token = os.environ.get('TELEGRAM_LEADS_BOT_TOKEN')
        payment_token = os.environ.get('TELEGRAM_PAYMENT_BOT_TOKEN')
        admin_chat_id = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
        recipient_ids = [rid for rid in [admin_chat_id, '976372702'] if rid]

        def tg_call(token, tg_method, body=None):
            started = _time.time()
            url = f'https://api.telegram.org/bot{token}/{tg_method}'
            try:
                data = json.dumps(body).encode('utf-8') if body is not None else None
                req = URequest(url, data=data, headers={'Content-Type': 'application/json'})
                with uopen(req, timeout=25) as resp:
                    parsed = json.loads(resp.read().decode('utf-8'))
                    return {'ok': parsed.get('ok'), 'http_status': resp.status, 'ms': round((_time.time() - started) * 1000), 'response': parsed}
            except UHTTPError as he:
                err_body = ''
                try:
                    err_body = he.read().decode('utf-8')[:300]
                except Exception:
                    pass
                return {'ok': False, 'http_status': he.code, 'ms': round((_time.time() - started) * 1000), 'error': f'HTTP {he.code}', 'response': err_body}
            except Exception as e:
                return {'ok': False, 'http_status': None, 'ms': round((_time.time() - started) * 1000), 'error': f'{type(e).__name__}: {str(e)}'}

        results = {'bots': {}}
        bots = [
            ('Анкеты', 'TELEGRAM_QUESTIONNAIRE_BOT_TOKEN', questionnaire_token),
            ('Лиды', 'TELEGRAM_LEADS_BOT_TOKEN', leads_token),
            ('Оплаты', 'TELEGRAM_PAYMENT_BOT_TOKEN', payment_token),
        ]
        for bot_name, token_env, token in bots:
            entry = {
                'token_env': token_env,
                'token_present': bool(token),
                'token_length': len(token) if token else 0,
                'getMe': None,
                'sends': [],
            }
            if not token:
                entry['getMe'] = {'ok': False, 'error': 'token not configured'}
                results['bots'][bot_name] = entry
                continue
            entry['getMe'] = tg_call(token, 'getMe')
            for chat_id in recipient_ids:
                send_res = tg_call(token, 'sendMessage', {
                    'chat_id': chat_id,
                    'text': f'✅ Тест бота «LineaSchool — {bot_name}»: сообщение доставлено!',
                })
                send_res['chat_id'] = chat_id
                entry['sends'].append(send_res)
            results['bots'][bot_name] = entry

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