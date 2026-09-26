'''
Business: Приём обращений в техподдержку из админки. ФИО автора берётся из сессии
          сотрудника (X-Auth-Token), запрос с секретным ключом уходит на внешний сервис
          окна взаимодействия. Ключ X-Service-Key никогда не попадает в браузер.
Args: event с body {urgency, note, shots[]} и заголовком X-Auth-Token
Returns: JSON {ok: bool, message?: str}
'''
import json
import os
from typing import Any, Dict, List

import psycopg2
import requests
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

SUPPORT_URL = 'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1?action=support'

MAX_SHOTS = 5
MAX_SHOT_BYTES = 8 * 1024 * 1024
URGENCIES = ('urgent', 'medium', 'low')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


def resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, ensure_ascii=False),
        'isBase64Encoded': False,
    }


def _header(event: Dict[str, Any], name: str) -> str:
    headers = event.get('headers') or {}
    for k, v in headers.items():
        if k.lower() == name.lower():
            return v or ''
    return ''


def _author_from_session(token: str) -> str:
    '''ФИО сотрудника по токену сессии. Пустая строка, если сессии нет.'''
    dsn = os.environ.get('DATABASE_URL')
    if not token or not dsn:
        return ''
    try:
        with psycopg2.connect(dsn) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f'SELECT s.full_name FROM {SCHEMA}.staff_sessions ss '
                    f'JOIN {SCHEMA}.staff s ON s.id = ss.staff_id '
                    f'WHERE ss.token = %s AND ss.expires_at > now()',
                    (token,),
                )
                row = cur.fetchone()
                return (row or {}).get('full_name') or ''
    except Exception as e:
        print(f'session lookup failed: {e}')
        return ''


def _clean_shots(raw: Any) -> List[str]:
    '''Оставляет максимум 5 корректных data URL, каждый не больше 8 МБ.'''
    if not isinstance(raw, list):
        return []
    out: List[str] = []
    for item in raw:
        if not isinstance(item, str) or not item.startswith('data:image/'):
            continue
        if len(item) > MAX_SHOT_BYTES * 4 // 3 + 128:
            continue
        out.append(item)
        if len(out) >= MAX_SHOTS:
            break
    return out


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': '', 'isBase64Encoded': False}
    if method != 'POST':
        return resp(405, {'ok': False, 'message': 'Метод не поддерживается'})

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return resp(400, {'ok': False, 'message': 'Некорректный запрос'})

    note = (body.get('note') or '').strip()
    if not note:
        return resp(400, {'ok': False, 'message': 'Опишите вашу проблему'})

    urgency = body.get('urgency') or 'medium'
    if urgency not in URGENCIES:
        urgency = 'medium'

    author = _author_from_session(_header(event, 'X-Auth-Token'))
    if not author:
        author = (body.get('author_fallback') or '').strip() or 'Сотрудник админки'

    service_key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not service_key:
        return resp(500, {'ok': False, 'message': 'Техподдержка не настроена: нет ключа доступа'})

    payload = {
        'source': 'admin',
        'author': author,
        'urgency': urgency,
        'note': note,
        'shots': _clean_shots(body.get('shots')),
    }

    try:
        r = requests.post(
            SUPPORT_URL,
            json=payload,
            headers={'Content-Type': 'application/json', 'X-Service-Key': service_key},
            timeout=60,
        )
    except Exception as e:
        print(f'support request failed: {e}')
        return resp(502, {'ok': False, 'message': 'Не удалось связаться с техподдержкой'})

    try:
        data = r.json()
    except Exception:
        data = {}

    if r.status_code >= 400 or not data.get('ok'):
        msg = data.get('message') or f'Техподдержка вернула ошибку {r.status_code}'
        return resp(200, {'ok': False, 'message': msg})

    return resp(200, {'ok': True})
