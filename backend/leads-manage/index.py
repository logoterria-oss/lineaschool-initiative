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
            return build_stats(cur, params.get('from') or '', params.get('to') or '')

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


MONTHS_MAP = {1: 'Январь', 2: 'Февраль', 3: 'Март', 4: 'Апрель', 5: 'Май',
              6: 'Июнь', 7: 'Июль', 8: 'Август', 9: 'Сентябрь', 10: 'Октябрь',
              11: 'Ноябрь', 12: 'Декабрь'}


def parse_request_date(text, created_at):
    """
    Возвращает date из request_date (форматы DD.MM, DD.MM.YYYY, DD/MM...).
    Год: если не указан — берём из created_at (когда лид попал в базу).
    Если распарсить не удалось — используем дату created_at.
    """
    from datetime import date
    fallback_year = created_at.year if created_at else date.today().year
    s = (text or '').strip().replace('/', '.')
    parts = [p for p in s.split('.') if p != '']
    try:
        if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
            day = int(parts[0])
            month = int(parts[1])
            year = fallback_year
            if len(parts) >= 3 and parts[2].isdigit():
                year = int(parts[2])
                if year < 100:
                    year += 2000
            return date(year, month, day)
    except (ValueError, IndexError):
        pass
    return created_at.date() if created_at else None


def build_stats(cur, date_from, date_to):
    from datetime import datetime

    def parse_bound(v):
        try:
            return datetime.strptime(v, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return None

    d_from = parse_bound(date_from)
    d_to = parse_bound(date_to)

    cur.execute(
        "SELECT lead_status, processing_status, diag_date, request_date, "
        "responsible, created_at FROM leads"
    )
    rows = cur.fetchall()

    by_lead_status = {}
    by_processing = {}
    by_month = {}
    by_responsible = {}
    total = 0
    clients = 0
    diag_count = 0

    for lead_status, processing, diag_date, request_date, responsible, created_at in rows:
        rd = parse_request_date(request_date, created_at)
        if d_from and (rd is None or rd < d_from):
            continue
        if d_to and (rd is None or rd > d_to):
            continue

        total += 1

        ls = lead_status or 'не указан'
        by_lead_status[ls] = by_lead_status.get(ls, 0) + 1
        if ls == 'клиент':
            clients += 1

        ps = processing or 'не указан'
        by_processing[ps] = by_processing.get(ps, 0) + 1

        resp = (responsible or '').strip() or 'Не назначен'
        by_responsible[resp] = by_responsible.get(resp, 0) + 1

        dd = (diag_date or '').strip()
        if dd and dd != '-':
            diag_count += 1

        if rd is not None:
            label = MONTHS_MAP.get(rd.month, 'Не указан')
            key = f'{rd.year}-{rd.month:02d}'
            by_month.setdefault(key, {'label': f'{label} {rd.year}', 'count': 0})
            by_month[key]['count'] += 1
        else:
            by_month.setdefault('none', {'label': 'Не указан', 'count': 0})
            by_month['none']['count'] += 1

    by_month_out = {v['label']: v['count'] for k, v in sorted(by_month.items())}

    conv_to_diag = round(diag_count / total * 100, 1) if total else 0
    conv_to_client = round(clients / total * 100, 1) if total else 0

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
        'total': total,
        'clients': clients,
        'diag_count': diag_count,
        'conv_to_diag': conv_to_diag,
        'conv_to_client': conv_to_client,
        'by_lead_status': by_lead_status,
        'by_processing': by_processing,
        'by_month': by_month_out,
        'by_responsible': by_responsible,
        'from': date_from,
        'to': date_to,
    }), 'isBase64Encoded': False}