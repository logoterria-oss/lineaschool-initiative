import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def get_conversation(telegram_user_id: int) -> Optional[Dict]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM conversations WHERE telegram_user_id = %s ORDER BY id DESC LIMIT 1",
                (telegram_user_id,)
            )
            return dict(cur.fetchone()) if cur.fetchone() else None
    finally:
        conn.close()

def create_conversation(telegram_user_id: int, first_name: str, last_name: str, username: str) -> int:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO conversations (telegram_user_id, first_name, last_name, telegram_username, status, assigned_to)
                   VALUES (%s, %s, %s, %s, 'active', 'ai') RETURNING id""",
                (telegram_user_id, first_name, last_name, username)
            )
            conversation_id = cur.fetchone()[0]
            conn.commit()
            return conversation_id
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

def send_telegram_message(chat_id: int, text: str, bot_token: str):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    requests.post(url, json={'chat_id': chat_id, 'text': text})

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
            'body': ''
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        if 'message' not in body:
            return {'statusCode': 200, 'body': json.dumps({'ok': True})}
        
        message = body['message']
        chat_id = message['chat']['id']
        text = message.get('text', '')
        
        from_user = message.get('from', {})
        telegram_user_id = from_user.get('id')
        first_name = from_user.get('first_name', '')
        last_name = from_user.get('last_name', '')
        username = from_user.get('username', '')
        
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, assigned_to FROM conversations WHERE telegram_user_id = %s ORDER BY id DESC LIMIT 1",
                    (telegram_user_id,)
                )
                result = cur.fetchone()
                
                if result:
                    conversation = dict(result)
                    conversation_id = conversation['id']
                    
                    if conversation['assigned_to'] == 'manual':
                        save_message(conversation_id, 'user', text)
                        return {'statusCode': 200, 'body': json.dumps({'ok': True, 'manual_mode': True})}
                else:
                    cur.execute(
                        """INSERT INTO conversations (telegram_user_id, first_name, last_name, telegram_username, status, assigned_to)
                           VALUES (%s, %s, %s, %s, 'active', 'ai') RETURNING id""",
                        (telegram_user_id, first_name, last_name, username)
                    )
                    conversation_id = cur.fetchone()[0]
                    conn.commit()
                
                save_message(conversation_id, 'user', text)
                
                history = get_conversation_history(conversation_id)
                ai_response = generate_ai_response(text, history)
                
                save_message(conversation_id, 'ai', ai_response)
                
                bot_token = os.environ.get('TELEGRAM_BOT_API_TOKEN')
                send_telegram_message(chat_id, ai_response, bot_token)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'ok': True})
                }
        finally:
            conn.close()
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }