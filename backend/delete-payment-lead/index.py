'''
Business: Удаление записи об оплате руководителем.
Args: event с httpMethod, body (id), headers (X-Admin-Password)
Returns: HTTP-ответ со статусом удаления
'''
import json
import os
import psycopg2
from typing import Dict, Any

ADMIN_PASSWORD = '426874'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
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

    if method not in ('POST', 'DELETE'):
        return _resp(405, {'error': 'Method not allowed'})

    headers = event.get('headers', {})
    password = headers.get('X-Admin-Password', headers.get('x-admin-password', ''))
    if password != ADMIN_PASSWORD:
        return _resp(401, {'error': 'Неверный пароль'})

    body_data = json.loads(event.get('body', '{}'))
    lead_id = body_data.get('id')

    try:
        lead_id = int(lead_id)
    except (TypeError, ValueError):
        return _resp(400, {'error': 'Некорректный id'})

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return _resp(500, {'error': 'Database not configured'})

    try:
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        # Защита заморозки: нельзя удалять платёж из месяца, сверённого с бухгалтером
        cur.execute(
            f"SELECT to_char(COALESCE(paid_at, created_at) + interval '3 hours', 'YYYY-MM') "
            f"FROM {schema}.payment_leads WHERE id = %s",
            (lead_id,)
        )
        mrow = cur.fetchone()
        if mrow and mrow[0]:
            cur.execute(f"SELECT 1 FROM {schema}.closed_months WHERE month = %s", (mrow[0],))
            if cur.fetchone():
                cur.close()
                conn.close()
                return _resp(409, {'error': f'Месяц {mrow[0]} сверён с бухгалтером и закрыт для изменений'})
        # Сначала запоминаем заявку в чёрном списке, чтобы автосинхронизация
        # с почтой банка не воскресила её из старого письма об оплате
        cur.execute(
            f"INSERT INTO {schema}.payment_blocklist (order_id, transaction_id, name, reason) "
            f"SELECT order_id, transaction_id, name, 'manual_delete' "
            f"FROM {schema}.payment_leads WHERE id = %s",
            (lead_id,)
        )
        cur.execute(f"DELETE FROM {schema}.payment_leads WHERE id = %s RETURNING id", (lead_id,))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            return _resp(404, {'error': 'Оплата не найдена'})
        return _resp(200, {'success': True, 'deleted': row[0]})
    except Exception as e:
        print(f'Database error: {str(e)}')
        return _resp(500, {'error': str(e)})