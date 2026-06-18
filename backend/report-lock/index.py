'''
Business: Заморозка месяца после сверки с бухгалтером.
GET — список замороженных месяцев. POST {month, action: lock|unlock} — заморозить/разморозить.
Args: event с httpMethod, body (month, action), headers (X-Admin-Password)
Returns: HTTP-ответ со списком или статусом
'''
import json
import os
import re
import psycopg2
from typing import Dict, Any

ADMIN_PASSWORD = '426874'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS_HEADERS},
        'body': json.dumps(body, ensure_ascii=False),
        'isBase64Encoded': False,
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': '', 'isBase64Encoded': False}

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return _resp(500, {'error': 'Database not configured'})

    if method == 'GET':
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        cur.execute(f"SELECT month, closed_at FROM {schema}.closed_months ORDER BY month DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        items = [{'month': r[0], 'closed_at': r[1].isoformat() if r[1] else None} for r in rows]
        return _resp(200, {'months': items})

    if method == 'POST':
        headers = event.get('headers', {})
        password = headers.get('X-Admin-Password', headers.get('x-admin-password', ''))
        if password != ADMIN_PASSWORD:
            return _resp(401, {'error': 'Неверный пароль'})

        body_data = json.loads(event.get('body', '{}'))
        month = (body_data.get('month') or '').strip()
        action = (body_data.get('action') or 'lock').strip()

        if not re.match(r'^\d{4}-\d{2}$', month):
            return _resp(400, {'error': 'Некорректный месяц (нужен формат YYYY-MM)'})

        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        if action == 'unlock':
            cur.execute(f"DELETE FROM {schema}.closed_months WHERE month = %s", (month,))
        else:
            cur.execute(
                f"INSERT INTO {schema}.closed_months (month) VALUES (%s) ON CONFLICT (month) DO NOTHING",
                (month,)
            )
        conn.commit()
        cur.close()
        conn.close()
        return _resp(200, {'success': True, 'month': month, 'locked': action != 'unlock'})

    return _resp(405, {'error': 'Method not allowed'})
