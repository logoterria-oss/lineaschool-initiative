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
    'report_link', 'schedule', 'teachers', 'comment', 'contact_when', 'source',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
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
        cur.execute("ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_when TEXT DEFAULT ''")

        params = event.get('queryStringParameters') or {}

        if method == 'GET' and params.get('action') == 'stats':
            return build_stats(cur, params.get('from') or '', params.get('to') or '')

        if method == 'GET':
            cur.execute(
                "SELECT id, parent_name, student_name, student_age, contact, request_date, "
                "responsible, processing_status, lead_status, diag_date, report_link, "
                "schedule, teachers, comment, contact_when, source, created_at, updated_at, "
                "utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_page, referrer, "
                "status_changed_at, archived, archived_at "
                "FROM leads ORDER BY id ASC"
            )
            cols = ['id', 'parent_name', 'student_name', 'student_age', 'contact',
                    'request_date', 'responsible', 'processing_status', 'lead_status',
                    'diag_date', 'report_link', 'schedule', 'teachers', 'comment',
                    'contact_when', 'source', 'created_at', 'updated_at',
                    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                    'landing_page', 'referrer', 'status_changed_at', 'archived', 'archived_at']
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
            if 'archived' in body:
                # Архив доски: лид убирается из колонок, но остаётся в таблице
                if body['archived']:
                    sets.append("archived = TRUE, archived_at = CURRENT_TIMESTAMP")
                else:
                    sets.append("archived = FALSE, archived_at = NULL")
            if 'processing_status' in body:
                # Дата перехода в колонку доски — только если статус реально сменился
                new_ps = esc(body['processing_status'])
                sets.append(
                    f"status_changed_at = CASE WHEN COALESCE(processing_status, '') <> '{new_ps}' "
                    "THEN CURRENT_TIMESTAMP ELSE status_changed_at END"
                )
            sets.append("updated_at = CURRENT_TIMESTAMP")
            cur.execute(f"UPDATE leads SET {', '.join(sets)} WHERE id = {lead_id} RETURNING status_changed_at")
            row = cur.fetchone()
            changed = row[0].isoformat() if row and row[0] else None
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps({'success': True, 'status_changed_at': changed}), 'isBase64Encoded': False}

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


def finalize(bucket):
    """Список строк с конверсиями, крупные кампании сверху."""
    out = []
    for b in bucket.values():
        t = b['total']
        b['conv_to_diag'] = round(b['diag'] / t * 100, 1) if t else 0
        b['conv_to_client'] = round(b['clients'] / t * 100, 1) if t else 0
        out.append(b)
    out.sort(key=lambda x: (-x['total'], x['name']))
    return out


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
        "responsible, created_at, utm_source, utm_medium, utm_campaign, "
        "utm_content, referrer FROM leads"
    )
    rows = cur.fetchall()

    by_lead_status = {}
    by_processing = {}
    by_month = {}
    by_responsible = {}
    total = 0
    clients = 0
    diag_count = 0

    # Эффективность рекламы: по кампаниям, источникам и объявлениям
    by_campaign = {}
    by_source = {}
    by_content = {}

    def bump(bucket, key, is_diag, is_client, extra=None):
        b = bucket.setdefault(key, {'name': key, 'total': 0, 'diag': 0, 'clients': 0})
        if extra:
            b.update(extra)
        b['total'] += 1
        b['diag'] += 1 if is_diag else 0
        b['clients'] += 1 if is_client else 0

    for (lead_status, processing, diag_date, request_date, responsible, created_at,
         u_source, u_medium, u_campaign, u_content, referrer) in rows:
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
        is_diag = bool(dd and dd != '-')
        if is_diag:
            diag_count += 1
        is_client = ls == 'клиент'

        src = (u_source or '').strip()
        med = (u_medium or '').strip()
        camp = (u_campaign or '').strip()
        cont = (u_content or '').strip()
        if camp:
            camp_key = camp
        elif src:
            camp_key = f'{src} (без кампании)'
        else:
            camp_key = 'Без UTM-метки'
        bump(by_campaign, camp_key, is_diag, is_client,
             {'source': src, 'medium': med} if camp or src else None)

        if src:
            src_key = f'{src} / {med}' if med else src
        elif referrer:
            from urllib.parse import urlparse
            host = urlparse(referrer).netloc or referrer
            src_key = f'Переход с {host.replace("www.", "")}'
        else:
            src_key = 'Прямой заход / вручную'
        bump(by_source, src_key, is_diag, is_client)

        if cont:
            bump(by_content, f'{camp_key} → {cont}', is_diag, is_client)

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
        'by_campaign': finalize(by_campaign),
        'by_source': finalize(by_source),
        'by_content': finalize(by_content),
        'from': date_from,
        'to': date_to,
    }), 'isBase64Encoded': False}