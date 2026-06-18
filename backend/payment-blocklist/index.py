'''
Business: Управление чёрным списком удалённых платежей.
GET — список заблокированных платежей. POST {id} — снять блокировку (разблокировать).
Args: event с httpMethod, body (id для разблокировки), headers (X-Admin-Password)
Returns: HTTP-ответ со списком или статусом разблокировки
'''
import json
import os
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
        cur.execute(
            f"SELECT id, order_id, transaction_id, name, reason, blocked_at "
            f"FROM {schema}.payment_blocklist ORDER BY blocked_at DESC"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        items = [
            {
                'id': r[0],
                'order_id': r[1] or '',
                'transaction_id': r[2] or '',
                'name': r[3] or '',
                'reason': r[4] or '',
                'blocked_at': r[5].isoformat() if r[5] else None,
            }
            for r in rows
        ]
        return _resp(200, {'items': items})

    if method == 'POST':
        headers = event.get('headers', {})
        password = headers.get('X-Admin-Password', headers.get('x-admin-password', ''))
        if password != ADMIN_PASSWORD:
            return _resp(401, {'error': 'Неверный пароль'})

        body_data = json.loads(event.get('body', '{}'))
        block_id = body_data.get('id')
        try:
            block_id = int(block_id)
        except (TypeError, ValueError):
            return _resp(400, {'error': 'Некорректный id'})

        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        cur.execute(
            f"DELETE FROM {schema}.payment_blocklist WHERE id = %s RETURNING id",
            (block_id,)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return _resp(404, {'error': 'Запись не найдена'})
        return _resp(200, {'success': True, 'unblocked': row[0]})

    return _resp(405, {'error': 'Method not allowed'})
