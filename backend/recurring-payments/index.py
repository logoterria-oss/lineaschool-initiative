'''
Business: Календарь регулярных платежей — CRUD для списка постоянных трат
(ежемесячных, раз в несколько месяцев, раз в год) с категорией, назначением,
суммой и датой следующего платежа.
Args: event с httpMethod (GET/POST/PUT/DELETE), body, queryStringParameters, headers (X-Admin-Password)
Returns: HTTP-ответ со списком платежей или результатом операции
'''
import json
import os
import psycopg2
from typing import Dict, Any

ADMIN_PASSWORD = '426874'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    'Access-Control-Max-Age': '86400',
}

CATEGORIES = [
    'ПО для уроков',
    'ПО для сайта',
    'ПО для мессенджера',
    'Ведение бизнеса',
    'Интернет и телефония',
    'Страховые и налоги ИП',
]


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS_HEADERS},
        'body': json.dumps(body, default=str),
        'isBase64Encoded': False,
    }


def _schema() -> str:
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def _ensure_table(cur, schema: str) -> None:
    cur.execute(f'''
        CREATE TABLE IF NOT EXISTS {schema}.recurring_payments (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            amount NUMERIC(12,2) NOT NULL DEFAULT 0,
            period_months INTEGER NOT NULL DEFAULT 1,
            next_date DATE NOT NULL,
            note TEXT DEFAULT '',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    ''')
    cur.execute(
        f'ALTER TABLE {schema}.recurring_payments '
        f'ADD COLUMN IF NOT EXISTS last_paid_at DATE'
    )
    cur.execute(
        f"ALTER TABLE {schema}.recurring_payments "
        f"ADD COLUMN IF NOT EXISTS amount_type TEXT NOT NULL DEFAULT 'fixed'"
    )
    cur.execute(
        f'ALTER TABLE {schema}.recurring_payments '
        f'ADD COLUMN IF NOT EXISTS percent NUMERIC(6,2) NOT NULL DEFAULT 0'
    )
    cur.execute(
        f"ALTER TABLE {schema}.recurring_payments "
        f"ADD COLUMN IF NOT EXISTS income_period TEXT NOT NULL DEFAULT ''"
    )


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': '', 'isBase64Encoded': False}

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return _resp(500, {'error': 'Database not configured'})

    schema = _schema()

    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        _ensure_table(cur, schema)
        conn.commit()

        if method == 'GET':
            cur.execute(
                f'SELECT id, title, category, amount, period_months, next_date, note, is_active, last_paid_at, '
                f'amount_type, percent, income_period '
                f'FROM {schema}.recurring_payments ORDER BY next_date ASC, id ASC'
            )
            rows = cur.fetchall()
            items = [
                {
                    'id': r[0],
                    'title': r[1],
                    'category': r[2],
                    'amount': float(r[3]),
                    'period_months': r[4],
                    'next_date': str(r[5]),
                    'note': r[6] or '',
                    'is_active': r[7],
                    'last_paid_at': str(r[8]) if r[8] else None,
                    'amount_type': r[9] or 'fixed',
                    'percent': float(r[10]) if r[10] is not None else 0.0,
                    'income_period': r[11] or '',
                }
                for r in rows
            ]
            cur.close()
            conn.close()
            return _resp(200, {'items': items, 'categories': CATEGORIES})

        headers = event.get('headers', {})
        password = headers.get('X-Admin-Password', headers.get('x-admin-password', ''))
        if password != ADMIN_PASSWORD:
            cur.close()
            conn.close()
            return _resp(401, {'error': 'Неверный пароль'})

        body_data = json.loads(event.get('body', '{}') or '{}')

        if method == 'POST':
            title = (body_data.get('title') or '').strip()
            category = (body_data.get('category') or '').strip()
            amount = body_data.get('amount')
            period_months = body_data.get('period_months')
            next_date = (body_data.get('next_date') or '').strip()
            note = (body_data.get('note') or '').strip()
            amount_type = (body_data.get('amount_type') or 'fixed').strip()
            percent = body_data.get('percent')
            income_period = (body_data.get('income_period') or '').strip()

            if amount_type not in ('fixed', 'percent'):
                amount_type = 'fixed'

            if not title or not category or not next_date:
                cur.close(); conn.close()
                return _resp(400, {'error': 'Заполните назначение, категорию и дату платежа'})
            try:
                amount = float(amount) if amount not in (None, '') else 0.0
                percent = float(percent) if percent not in (None, '') else 0.0
                period_months = int(period_months) if period_months not in (None, '') else 1
            except (TypeError, ValueError):
                cur.close(); conn.close()
                return _resp(400, {'error': 'Некорректная сумма, процент или период'})

            cur.execute(
                f'INSERT INTO {schema}.recurring_payments '
                f'(title, category, amount, period_months, next_date, note, amount_type, percent, income_period) '
                f'VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id',
                (title, category, amount, period_months, next_date, note, amount_type, percent, income_period),
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close(); conn.close()
            return _resp(200, {'success': True, 'id': new_id})

        if method == 'PUT':
            pid = body_data.get('id')
            if not pid:
                cur.close(); conn.close()
                return _resp(400, {'error': 'Не указан id'})

            # Отметить оплату: запомнить дату оплаты и сдвинуть next_date на period_months
            if body_data.get('mark_paid'):
                cur.execute(
                    f"UPDATE {schema}.recurring_payments "
                    f"SET last_paid_at = CURRENT_DATE, "
                    f"next_date = next_date + (period_months || ' months')::interval, updated_at = NOW() "
                    f"WHERE id = %s RETURNING next_date",
                    (pid,),
                )
                row = cur.fetchone()
                conn.commit()
                cur.close(); conn.close()
                if not row:
                    return _resp(404, {'error': 'Платёж не найден'})
                return _resp(200, {'success': True, 'next_date': str(row[0])})

            # Отменить последнюю оплату: вернуть next_date назад
            if body_data.get('unmark_paid'):
                cur.execute(
                    f"UPDATE {schema}.recurring_payments "
                    f"SET last_paid_at = NULL, "
                    f"next_date = next_date - (period_months || ' months')::interval, updated_at = NOW() "
                    f"WHERE id = %s RETURNING next_date",
                    (pid,),
                )
                row = cur.fetchone()
                conn.commit()
                cur.close(); conn.close()
                if not row:
                    return _resp(404, {'error': 'Платёж не найден'})
                return _resp(200, {'success': True, 'next_date': str(row[0])})

            title = (body_data.get('title') or '').strip()
            category = (body_data.get('category') or '').strip()
            amount = body_data.get('amount')
            period_months = body_data.get('period_months')
            next_date = (body_data.get('next_date') or '').strip()
            note = (body_data.get('note') or '').strip()
            is_active = body_data.get('is_active', True)
            amount_type = (body_data.get('amount_type') or 'fixed').strip()
            percent = body_data.get('percent')
            income_period = (body_data.get('income_period') or '').strip()

            if amount_type not in ('fixed', 'percent'):
                amount_type = 'fixed'

            try:
                amount = float(amount) if amount not in (None, '') else 0.0
                percent = float(percent) if percent not in (None, '') else 0.0
                period_months = int(period_months) if period_months not in (None, '') else 1
            except (TypeError, ValueError):
                cur.close(); conn.close()
                return _resp(400, {'error': 'Некорректная сумма, процент или период'})

            cur.execute(
                f'UPDATE {schema}.recurring_payments SET '
                f'title=%s, category=%s, amount=%s, period_months=%s, next_date=%s, note=%s, '
                f'is_active=%s, amount_type=%s, percent=%s, income_period=%s, updated_at=NOW() WHERE id=%s',
                (title, category, amount, period_months, next_date, note, bool(is_active),
                 amount_type, percent, income_period, pid),
            )
            conn.commit()
            cur.close(); conn.close()
            return _resp(200, {'success': True})

        if method == 'DELETE':
            qs = event.get('queryStringParameters') or {}
            pid = body_data.get('id') or qs.get('id')
            if not pid:
                cur.close(); conn.close()
                return _resp(400, {'error': 'Не указан id'})
            cur.execute(f'DELETE FROM {schema}.recurring_payments WHERE id=%s', (pid,))
            conn.commit()
            cur.close(); conn.close()
            return _resp(200, {'success': True})

        cur.close(); conn.close()
        return _resp(405, {'error': 'Method not allowed'})
    except Exception as e:
        print(f'Database error: {str(e)}')
        return _resp(500, {'error': str(e)})