import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p93118852_lineaschool_initiati'

CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}


def _json(payload, code=200):
    return {
        'statusCode': code,
        'headers': CORS,
        'body': json.dumps(payload, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def handler(event: dict, context) -> dict:
    """Ставки педагогов по отчётным периодам: GET список, POST сохранить/зафиксировать."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': '', 'isBase64Encoded': False}

    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=5)
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if method == 'GET':
            cur.execute(f"""
                SELECT teacher_id, teacher_name, lesson_form, period_key,
                       current_rate, planned_rate, planned_locked
                FROM {SCHEMA}.teacher_rates
                ORDER BY period_key, teacher_name
            """)
            return _json({'success': True, 'rates': cur.fetchall()})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            teacher_id = body.get('teacher_id')
            lesson_form = (body.get('lesson_form') or '').strip()
            period_key = (body.get('period_key') or '').strip()
            if not teacher_id or lesson_form not in ('group', 'individual') or not period_key:
                return _json({'success': False, 'error': 'teacher_id, lesson_form, period_key обязательны'}, 400)

            teacher_name = (body.get('teacher_name') or '').strip()
            current_rate = body.get('current_rate')
            planned_rate = body.get('planned_rate')
            planned_locked = bool(body.get('planned_locked'))

            def num(v):
                if v in (None, ''):
                    return None
                try:
                    return int(v)
                except (TypeError, ValueError):
                    return None

            cur.execute(f"""
                INSERT INTO {SCHEMA}.teacher_rates
                    (teacher_id, teacher_name, lesson_form, period_key,
                     current_rate, planned_rate, planned_locked, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (teacher_id, lesson_form, period_key) DO UPDATE SET
                    teacher_name = EXCLUDED.teacher_name,
                    current_rate = EXCLUDED.current_rate,
                    planned_rate = EXCLUDED.planned_rate,
                    planned_locked = EXCLUDED.planned_locked,
                    updated_at = NOW()
                RETURNING teacher_id, teacher_name, lesson_form, period_key,
                          current_rate, planned_rate, planned_locked
            """, (teacher_id, teacher_name, lesson_form, period_key,
                  num(current_rate), num(planned_rate), planned_locked))
            row = cur.fetchone()
            conn.commit()
            return _json({'success': True, 'rate': row})

        return _json({'success': False, 'error': 'Метод не поддерживается'}, 405)
    finally:
        conn.close()
