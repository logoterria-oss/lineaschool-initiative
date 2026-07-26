'''
Business: Управление списком лидов для ЛК руководителя — список, добавление, редактирование, удаление и сбор статистики
Args: event с httpMethod (GET список/статистика, POST создать, PUT обновить, DELETE удалить)
Returns: HTTP ответ со списком лидов или статистикой
'''
import json
import os
import psycopg2
from typing import Dict, Any

FIELDS = [
    'parent_name', 'student_name', 'student_age', 'contact', 'request_date',
    'responsible', 'processing_status', 'lead_status', 'diag_date',
    'report_link', 'schedule', 'teachers', 'comment', 'source',
]

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def esc(v: Any) -> str:
    if v is None:
        return ''
    return str(v).replace("'", "''")


def row_to_dict(row, cols) -> Dict[str, Any]:
    d = {}
    for i, c in enumerate(cols):
        val = row[i]
        d[c] = val.isoformat() if hasattr(val, 'isoformat') else val
    return d


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': '', 'isBase64Encoded': False}

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        params = event.get('queryStringParameters') or {}

        if method == 'GET' and params.get('action') == 'stats':
            return build_stats(cur)

        if method == 'GET':
            cur.execute(
                "SELECT id, parent_name, student_name, student_age, contact, request_date, "
                "responsible, processing_status, lead_status, diag_date, report_link, "
                "schedule, teachers, comment, source, created_at, updated_at "
                "FROM leads ORDER BY id ASC"
            )
            cols = ['id', 'parent_name', 'student_name', 'student_age', 'contact',
                    'request_date', 'responsible', 'processing_status', 'lead_status',
                    'diag_date', 'report_link', 'schedule', 'teachers', 'comment',
                    'source', 'created_at', 'updated_at']
            rows = [row_to_dict(r, cols) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps({'leads': rows}), 'isBase64Encoded': False}

        body = json.loads(event.get('body') or '{}')

        if method == 'POST':
            cols = ', '.join(FIELDS)
            vals = ', '.join("'" + esc(body.get(f, '')) + "'" for f in FIELDS)
            cur.execute(f"INSERT INTO leads ({cols}) VALUES ({vals}) RETURNING id")
            new_id = cur.fetchone()[0]
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps({'success': True, 'id': new_id}),
                    'isBase64Encoded': False}

        if method == 'PUT':
            lead_id = int(body.get('id', 0))
            if not lead_id:
                return {'statusCode': 400, 'headers': CORS,
                        'body': json.dumps({'error': 'id required'}), 'isBase64Encoded': False}
            sets = [f"{f} = '{esc(body[f])}'" for f in FIELDS if f in body]
            sets.append("updated_at = CURRENT_TIMESTAMP")
            cur.execute(f"UPDATE leads SET {', '.join(sets)} WHERE id = {lead_id}")
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps({'success': True}), 'isBase64Encoded': False}

        if method == 'DELETE':
            lead_id = int(body.get('id', 0))
            cur.execute(f"DELETE FROM leads WHERE id = {lead_id}")
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps({'success': True}), 'isBase64Encoded': False}

        return {'statusCode': 405, 'headers': CORS,
                'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}
    finally:
        cur.close()
        conn.close()


def build_stats(cur) -> Dict[str, Any]:
    cur.execute("SELECT COUNT(*) FROM leads")
    total = cur.fetchone()[0]

    cur.execute("SELECT lead_status, COUNT(*) FROM leads GROUP BY lead_status")
    by_lead_status = {(r[0] or 'не указан'): r[1] for r in cur.fetchall()}

    cur.execute("SELECT processing_status, COUNT(*) FROM leads GROUP BY processing_status")
    by_processing = {(r[0] or 'не указан'): r[1] for r in cur.fetchall()}

    clients = by_lead_status.get('клиент', 0)
    cur.execute("SELECT COUNT(*) FROM leads WHERE diag_date <> '' AND diag_date <> '-'")
    diag_count = cur.fetchone()[0]

    conv_to_diag = round(diag_count / total * 100, 1) if total else 0
    conv_to_client = round(clients / total * 100, 1) if total else 0

    cur.execute(
        "SELECT CASE "
        "WHEN request_date ~ '^[0-9]{1,2}[./][0-9]{1,2}' "
        "THEN split_part(replace(request_date,'/','.'),'.',2) ELSE '' END AS m, COUNT(*) "
        "FROM leads GROUP BY m ORDER BY m"
    )
    months_map = {'04': 'Апрель', '05': 'Май', '06': 'Июнь', '07': 'Июль',
                  '08': 'Август', '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь',
                  '12': 'Декабрь', '01': 'Январь', '02': 'Февраль', '03': 'Март'}
    by_month = {}
    for r in cur.fetchall():
        key = (r[0] or '').zfill(2) if r[0] else ''
        label = months_map.get(key, 'Не указан')
        by_month[label] = by_month.get(label, 0) + r[1]

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
        'total': total,
        'clients': clients,
        'diag_count': diag_count,
        'conv_to_diag': conv_to_diag,
        'conv_to_client': conv_to_client,
        'by_lead_status': by_lead_status,
        'by_processing': by_processing,
        'by_month': by_month,
    }), 'isBase64Encoded': False}
