'''
Business: Список оплат для админки + страховочная выгрузка оплат
для «Окна взаимодействия» (?action=feed).
Args: event with httpMethod, queryStringParameters
Returns: HTTP response with list of payment leads
'''
import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime
from payment_hook import payment_payload


def service_key_ok(event: Dict[str, Any]) -> bool:
    '''Служебные запросы окна ходят с тем же ключом, что и хук анкет.'''
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        return False
    headers = event.get('headers') or {}
    got = ''
    for name, value in headers.items():
        if str(name).lower() == 'x-service-key':
            got = str(value or '')
            break
    return bool(got) and got == key


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Get database connection string
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters') or {}

    # Страховочная выгрузка для «Окна взаимодействия»: если хук не дошёл,
    # окно само забирает оплаты. status=new — те, что ещё не забирали.
    if params.get('action') == 'feed':
        if not service_key_ok(event):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'unauthorized'}),
                'isBase64Encoded': False,
            }
        return _feed(dsn, params.get('status') or 'new')

    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        # Get all leads ordered by created_at DESC
        cur.execute(
            "SELECT id, name, plan, amount, order_id, created_at, paid_at, "
            "transaction_id, source, crm_name FROM payment_leads ORDER BY created_at DESC"
        )
        
        rows = cur.fetchall()
        
        leads = []
        for row in rows:
            leads.append({
                'id': row[0],
                'name': row[1],
                'plan': row[2],
                'amount': float(row[3]),
                'order_id': row[4],
                'created_at': row[5].isoformat() if row[5] else None,
                'paid_at': row[6].isoformat() if row[6] else None,
                'transaction_id': row[7],
                'source': row[8] or 'acquiring',
                # Карточка в CRM, если её удалось надёжно подобрать
                'crm_name': row[9],
            })
        
        cur.close()
        conn.close()
        
        print(f'Found {len(leads)} payment leads')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'leads': leads}),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f'Database error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def _feed(dsn: str, status: str) -> Dict[str, Any]:
    '''Оплаты для «Окна взаимодействия». Отдаём только подтверждённые:
    карточка «Оплачено» не должна появляться по неоплаченной заявке.
    Телефон подставляем из карточки CRM — по нему окно находит диалог.'''
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    where = 'AND p.interaction_sent_at IS NULL' if status == 'new' else ''
    cur.execute(f"""
        SELECT p.name, p.crm_name, p.plan, p.amount, p.order_id,
               p.paid_at, p.transaction_id, c.phone
        FROM {schema}.payment_leads p
        LEFT JOIN {schema}.crm_customers_cache c ON c.name = p.crm_name
        WHERE p.paid_at IS NOT NULL {where}
        ORDER BY p.paid_at DESC
        LIMIT 200
    """)
    columns = [desc[0] for desc in cur.description]
    rows = [dict(zip(columns, row)) for row in cur.fetchall()]
    payments = [payment_payload(r) for r in rows]

    # Отдали — значит забрали: помечаем, чтобы не приходили повторно
    if status == 'new' and payments:
        cur.execute(
            f"UPDATE {schema}.payment_leads SET interaction_sent_at = CURRENT_TIMESTAMP "
            f"WHERE order_id = ANY(%s)",
            ([p['orderId'] for p in payments],),
        )
        conn.commit()

    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'payments': payments}, ensure_ascii=False),
        'isBase64Encoded': False,
    }