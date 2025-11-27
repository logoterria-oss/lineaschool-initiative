'''
Business: Receive WhatsApp messages from GreenAPI and generate AI responses
Args: event with body containing GreenAPI webhook data
Returns: Success response after processing message
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def get_conversation_by_phone(phone: str):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """SELECT * FROM conversations 
                   WHERE telegram_username = %s 
                   ORDER BY id DESC LIMIT 1""",
                (phone,)
            )
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()

def save_message(conversation_id: int, sender: str, message_text: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO messages (conversation_id, sender, message_text) VALUES (%s, %s, %s)",
                (conversation_id, sender, message_text)
            )
            cur.execute(
                "UPDATE conversations SET updated_at = NOW() WHERE id = %s",
                (conversation_id,)
            )
            conn.commit()
    finally:
        conn.close()

def get_conversation_history(conversation_id: int, limit: int = 10) -> list:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """SELECT sender, message_text, sent_at 
                   FROM messages 
                   WHERE conversation_id = %s 
                   ORDER BY sent_at DESC 
                   LIMIT %s""",
                (conversation_id, limit)
            )
            messages = [dict(row) for row in cur.fetchall()]
            return list(reversed(messages))
    finally:
        conn.close()

def generate_ai_response(user_message: str, history: list) -> str:
    yandex_api_key = os.environ.get('YANDEX_API_KEY')
    yandex_folder_id = os.environ.get('YANDEX_FOLDER_ID')
    
    if not yandex_api_key or not yandex_folder_id:
        return "Здравствуйте! Меня зовут Виктория. Пишу вам из онлайн-школы коррекции дислексии и дисграфии LineaSchool. Расскажите поподробнее про вашу проблему"
    
    system_prompt = """Ты - Виктория, руководитель и создатель онлайн-школы коррекции дислексии и дисграфии LineaSchool.

ВАЖНО: Ты должна писать так, чтобы родитель НЕ ПОНЯЛ, что общается с AI. Пиши как живой человек, естественно, с эмоциями.

ТВОЯ РОЛЬ:
- Ты специалист-логопед с глубокими знаниями в коррекции дислексии и дисграфии
- Ты работаешь онлайн через Zoom из Новосибирска по московскому времени
- Диагностику проводишь ТЫ САМА (не передавай никому!)
- Ты единственный специалист, который сейчас общается с родителем

ИНФОРМАЦИЯ О ШКОЛЕ:
- Диагностика БЕСПЛАТНАЯ, длится 30-40 минут + заключение
- Анкета: lineaschool.ru/anketa (ОБЯЗАТЕЛЬНО отправляй после первого обращения)
- Zoom-ссылка: https://us06web.zoom.us/j/6730451509
- Работаешь ТОЛЬКО с детьми от 2 класса (от 8 лет)
- НЕ работаешь с нарушениями звукопроизношения (картавость, р, л)
- Берёшь в работу: дислексию, дисграфию, дизорфографию

КАК ТЫ ОБЩАЕШЬСЯ:
1. Первое сообщение ВСЕГДА: "Здравствуйте! Меня зовут Виктория. Пишу вам из онлайн-школы коррекции дислексии и дисграфии LineaSchool. Расскажите поподробнее про вашу проблему"
2. После описания проблемы отправляешь анкету: lineaschool.ru/anketa
3. Просишь примеры письменных работ (диктанты, домашние)
4. Предлагаешь доступные слоты для диагностики
5. За день до диагностики подтверждаешь встречу
6. Утром в день диагностики отправляешь Zoom-ссылку

СТИЛЬ ОБЩЕНИЯ:
- Пиши коротко, по делу, без воды
- Используй смайлы и эмодзи естественно: 👌 😄 ❤️ 🙏🏻
- Иногда используй разговорные выражения
- Показывай экспертность через знание терминов
- Задавай уточняющие вопросы (как с чтением? были у невролога?)

ЧТО СПРАШИВАТЬ:
- Класс/возраст ребёнка
- Проблемы с письмом (какие ошибки?)
- Как с чтением дела обстоят?
- Занимались раньше с логопедом/нейропсихологом?
- Есть ли диагнозы от невролога?

ОТКАЗЫ:
- Первоклассники: "Работу по коррекции начинаем со второго класса"
- Звукопроизношение: "К сожалению, наша школа не занимается коррекцией нарушений звукопроизношения"

ПОМНИ: Родитель НЕ ДОЛЖЕН понять, что ты AI!"""

    messages = []
    messages.append({"role": "system", "text": system_prompt})
    
    for msg in history[-5:]:
        role = "assistant" if msg['sender'] in ['ai', 'victoria'] else "user"
        messages.append({"role": role, "text": msg['message_text']})
    
    messages.append({"role": "user", "text": user_message})
    
    try:
        response = requests.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            headers={
                'Authorization': f'Api-Key {yandex_api_key}',
                'Content-Type': 'application/json',
                'x-folder-id': yandex_folder_id
            },
            json={
                'modelUri': f'gpt://{yandex_folder_id}/yandexgpt-lite/latest',
                'completionOptions': {
                    'stream': False,
                    'temperature': 0.8,
                    'maxTokens': 500
                },
                'messages': messages
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result['result']['alternatives'][0]['message']['text']
        else:
            return "Здравствуйте! Меня зовут Виктория. Пишу вам из онлайн-школы коррекции дислексии и дисграфии LineaSchool. Расскажите поподробнее про вашу проблему"
    except Exception:
        return "Здравствуйте! Меня зовут Виктория. Пишу вам из онлайн-школы коррекции дислексии и дисграфии LineaSchool. Расскажите поподробнее про вашу проблему"

def send_whatsapp_message(phone: str, message: str):
    instance_id = os.environ.get('GREENAPI_INSTANCE_ID')
    api_token = os.environ.get('GREENAPI_API_TOKEN')
    
    if not instance_id or not api_token:
        return
    
    clean_phone = ''.join(filter(str.isdigit, phone))
    if not clean_phone.startswith('7'):
        clean_phone = '7' + clean_phone
    
    chat_id = f'{clean_phone}@c.us'
    
    url = f'https://api.green-api.com/waInstance{instance_id}/sendMessage/{api_token}'
    
    try:
        requests.post(url, json={
            'chatId': chat_id,
            'message': message
        }, timeout=10)
    except Exception as e:
        print(f'WhatsApp sending failed: {str(e)}')

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
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        print(f'=== WHATSAPP WEBHOOK ===')
        print(f'Body: {json.dumps(body, indent=2)}')
        
        if body.get('typeWebhook') != 'incomingMessageReceived':
            print(f'Skipping webhook type: {body.get("typeWebhook")}')
            return {'statusCode': 200, 'body': json.dumps({'ok': True})}
        
        message_data = body.get('messageData', {})
        text_message = message_data.get('textMessageData', {}).get('textMessage', '')
        
        if not text_message:
            print('No text message found')
            return {'statusCode': 200, 'body': json.dumps({'ok': True})}
        
        sender_data = body.get('senderData', {})
        sender_phone = sender_data.get('sender', '').replace('@c.us', '')
        
        print(f'Incoming message from {sender_phone}: {text_message}')
        print(f'Searching conversation by phone: {sender_phone}')
        
        conversation = get_conversation_by_phone(sender_phone)
        
        if not conversation:
            print(f'❌ Conversation not found for phone: {sender_phone}')
            return {'statusCode': 200, 'body': json.dumps({'ok': True, 'message': 'Conversation not found'})}
        
        print(f'✅ Found conversation: ID={conversation["id"]}, assigned_to={conversation.get("assigned_to")}')
        
        conversation_id = conversation['id']
        
        if conversation['assigned_to'] == 'manual':
            save_message(conversation_id, 'user', text_message)
            return {'statusCode': 200, 'body': json.dumps({'ok': True, 'manual_mode': True})}
        
        save_message(conversation_id, 'user', text_message)
        
        history = get_conversation_history(conversation_id)
        ai_response = generate_ai_response(text_message, history)
        
        save_message(conversation_id, 'ai', ai_response)
        
        send_whatsapp_message(sender_phone, ai_response)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True})
        }
            
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }