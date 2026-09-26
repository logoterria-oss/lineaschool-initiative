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
from crm_match import find_customer
from payment_hook import send_payment_hook, mark_hook_result

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

    # Подбираем карточку в AlfaCRM, но введённое имя не подменяем:
    # подбор может ошибиться, и оплата окажется на чужом ученике незаметно.
    crm_name = None
    if not plan.lower().startswith('другое'):
        crm_name = find_customer(name)

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return _resp(400, {'error': 'Некорректная сумма'})

    order_id = f'manual-{int(time.time() * 1000)}'

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return _resp(500, {'error': 'Database not configured'})

    try:
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        # Проверка заморозки месяца (МСК). Берём месяц оплаты, иначе текущий.
        cur.execute(
            f"SELECT to_char(COALESCE(%s::timestamp, NOW()) + interval '3 hours', 'YYYY-MM')",
            (paid_at or None,)
        )
        target_month = cur.fetchone()[0]
        cur.execute(f"SELECT 1 FROM {schema}.closed_months WHERE month = %s", (target_month,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return _resp(409, {'error': f'Месяц {target_month} сверён с бухгалтером и закрыт для изменений'})
        if paid_at:
            cur.execute(
                "INSERT INTO payment_leads (name, crm_name, email, phone, plan, amount, order_id, source, created_at, paid_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, 'manual', NOW(), %s) RETURNING id, paid_at",
                (name, crm_name, '', '', plan, amount, order_id, paid_at),
            )
        else:
            cur.execute(
                "INSERT INTO payment_leads (name, crm_name, email, phone, plan, amount, order_id, source, created_at, paid_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, 'manual', NOW(), NOW()) RETURNING id, paid_at",
                (name, crm_name, '', '', plan, amount, order_id),
            )
        new_id, saved_paid_at = cur.fetchone()
        conn.commit()

        # Оплата проведена — показываем карточку в «Окне взаимодействия».
        # После commit: сбой отправки не должен откатывать оплату.
        _notify_interaction(conn, {
            'name': name, 'crm_name': crm_name, 'plan': plan, 'amount': amount,
            'order_id': order_id, 'paid_at': saved_paid_at, 'transaction_id': None,
        }, schema)

        cur.close()
        conn.close()
        return _resp(200, {'success': True, 'id': new_id, 'order_id': order_id})
    except Exception as e:
        print(f'Database error: {str(e)}')
        return _resp(500, {'error': str(e)})


def _notify_interaction(conn, row: Dict[str, Any], schema: str) -> None:
    """Отдаёт карточку оплаты в «Окно взаимодействия».

    Телефон при ручном вводе не спрашиваем, поэтому берём его из карточки
    AlfaCRM — по номеру окно кладёт карточку в существующий диалог.
    Ошибка отправки не ломает приём оплаты: она уже зафиксирована,
    а недоставленную карточку окно заберёт через feed.
    """
    try:
        crm_name = row.get('crm_name')
        if crm_name:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT phone FROM {schema}.crm_customers_cache "
                    f"WHERE name = %s AND phone IS NOT NULL LIMIT 1",
                    (crm_name,),
                )
                found = cur.fetchone()
                if found:
                    row = {**row, 'phone': found[0]}

        result = send_payment_hook(row)
        mark_hook_result(conn, row['order_id'], result)
    except Exception as e:
        print(f"payment-hook failed for {row.get('order_id')}: {e}")