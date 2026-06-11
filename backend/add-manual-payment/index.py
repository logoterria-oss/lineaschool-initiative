'''
Business: Ручной ввод проведённой оплаты руководителем (для платежей вне эквайринга).
Args: event с httpMethod, body (name, plan, amount, paid_at?), headers (X-Admin-Password)
Returns: HTTP-ответ со статусом и id созданной записи
'''
import json
import os
import time
import psycopg2
from typing import Dict, Any

ADMIN_PASSWORD = '426874'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS_HEADERS},
        'body': json.dumps(body),
        'isBase64Encoded': False,
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': '', 'isBase64Encoded': False}

    if method != 'POST':
        return _resp(405, {'error': 'Method not allowed'})

    headers = event.get('headers', {})
    password = headers.get('X-Admin-Password', headers.get('x-admin-password', ''))
    if password != ADMIN_PASSWORD:
        return _resp(401, {'error': 'Неверный пароль'})

    body_data = json.loads(event.get('body', '{}'))
    name = (body_data.get('name') or '').strip()
    plan = (body_data.get('plan') or '').strip()
    amount = body_data.get('amount')
    paid_at = (body_data.get('paid_at') or '').strip()

    if not name or not plan or amount in (None, ''):
        return _resp(400, {'error': 'Заполните имя, тариф и сумму'})

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return _resp(400, {'error': 'Некорректная сумма'})

    order_id = f'manual-{int(time.time() * 1000)}'

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return _resp(500, {'error': 'Database not configured'})

    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        if paid_at:
            cur.execute(
                "INSERT INTO payment_leads (name, email, phone, plan, amount, order_id, source, created_at, paid_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, 'manual', NOW(), %s) RETURNING id",
                (name, '', '', plan, amount, order_id, paid_at),
            )
        else:
            cur.execute(
                "INSERT INTO payment_leads (name, email, phone, plan, amount, order_id, source, created_at, paid_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, 'manual', NOW(), NOW()) RETURNING id",
                (name, '', '', plan, amount, order_id),
            )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return _resp(200, {'success': True, 'id': new_id, 'order_id': order_id})
    except Exception as e:
        print(f'Database error: {str(e)}')
        return _resp(500, {'error': str(e)})
