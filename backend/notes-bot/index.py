import json
import os
import psycopg2
import requests
from datetime import datetime

OWNER_ID = 1112267464
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p93118852_lineaschool_initiati')


def send_message(token: str, chat_id: int, text: str):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    requests.post(url, json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"})


def save_note(conn, user_id: int, username: str, message: str):
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.admin_notes (telegram_user_id, username, message) VALUES (%s, %s, %s)",
            (user_id, username, message)
        )
    conn.commit()


def get_notes_for_period(conn, date_from: str, date_to: str):
    with conn.cursor() as cur:
        cur.execute(
            f"""SELECT message, username, created_at FROM {SCHEMA}.admin_notes
                WHERE created_at::date >= %s AND created_at::date <= %s
                ORDER BY created_at ASC""",
            (date_from, date_to)
        )
        return cur.fetchall()


def parse_period(text: str):
    """Парсит период вида 1.03-15.03 или 1.03.2026-15.03.2026"""
    parts = text.strip().split('-')
    if len(parts) != 2:
        return None, None
    
    current_year = datetime.now().year

    def parse_date(s):
        s = s.strip()
        for fmt in ('%d.%m.%Y', '%d.%m'):
            try:
                d = datetime.strptime(s, fmt)
                if fmt == '%d.%m':
                    d = d.replace(year=current_year)
                return d.strftime('%Y-%m-%d')
            except ValueError:
                continue
        return None

    return parse_date(parts[0]), parse_date(parts[1])


def handler(event: dict, context) -> dict:
    """Бот для записи заметок админа и получения сводки за период."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }

    token = os.environ['TELEGRAM_NOTES_BOT_TOKEN']

    body = json.loads(event.get('body') or '{}')
    message = body.get('message') or body.get('edited_message')

    if not message:
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    chat_id = message['chat']['id']
    user_id = message['from']['id']
    username = message['from'].get('username') or message['from'].get('first_name', '')
    text = message.get('text', '').strip()

    if not text:
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    try:
        # Команда /start
        if text == '/start':
            send_message(token, chat_id,
                "Привет! Я бот для заметок.\n\n"
                "<b>Для всех:</b> просто отправь любое сообщение — оно сохранится как заметка.\n\n"
                "<b>Для получения сводки</b> (только владелец):\n"
                "Отправь период в формате <code>1.03-15.03</code>"
            )
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

        # Проверка — это запрос сводки?
        if user_id == OWNER_ID and '-' in text and '.' in text:
            date_from, date_to = parse_period(text)
            if date_from and date_to:
                notes = get_notes_for_period(conn, date_from, date_to)
                if not notes:
                    send_message(token, chat_id, f"За период {text} заметок не найдено.")
                else:
                    lines = [f"<b>Заметки за {text}:</b>\n"]
                    for msg, uname, created_at in notes:
                        dt = created_at.strftime('%d.%m %H:%M')
                        lines.append(f"• [{dt}] <i>@{uname}</i>: {msg}")
                    send_message(token, chat_id, "\n".join(lines))
                return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

        # Сохраняем заметку
        save_note(conn, user_id, username, text)
        send_message(token, chat_id, "✅ Заметка сохранена!")

    finally:
        conn.close()

    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
