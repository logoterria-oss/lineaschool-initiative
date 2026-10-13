"""
Запись на диагностику по окошкам, которые вручную заводят руководители.

Родитель (без входа): action=check, slots, book.
Сотрудники (X-Auth-Token): admin-slots, add-slots, delete-slot (только руководители),
links, create-link, public-link, toggle-link, delete-link, bookings, set-status, coverage.
Окна не повторяются из недели в неделю: каждое — конкретная дата и время по Москве.
"""
import json
import os
import re
import secrets
from datetime import date, timedelta
from typing import Any, Dict, Optional

import psycopg2
from psycopg2.extras import RealDictCursor

from diag_hook import diag_payload, mark_diag_hook, send_diag_hook

SCHEMA = 't_p93118852_lineaschool_initiati'
MSK_NOW = "(now() AT TIME ZONE 'Europe/Moscow')"
# Окна должны быть заведены на 2 недели вперёд
COVERAGE_DAYS = 14

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Service-Key',
    'Access-Control-Max-Age': '86400',
}

WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
STATUS_LABELS = {'new': 'Новая', 'confirmed': 'Подтверждена', 'rejected': 'Отменена'}
TIME_RE = re.compile(r'^([01]\d|2[0-3]):[0-5]\d$')


def _resp(status: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(payload, ensure_ascii=False, default=str), 'isBase64Encoded': False}


def _conn():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn


def _iso(d) -> str:
    return d.isoformat() if hasattr(d, 'isoformat') else str(d or '')


def _ru(d) -> str:
    return d.strftime('%d.%m.%Y') if hasattr(d, 'strftime') else ''


def _msk_today(cur) -> date:
    cur.execute(f"SELECT ({MSK_NOW})::date AS d")
    return cur.fetchone()['d']


def _me(cur, event) -> Optional[Dict[str, Any]]:
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        return None
    cur.execute(
        f"SELECT s.id, s.full_name, s.role FROM {SCHEMA}.staff_sessions ss "
        f"JOIN {SCHEMA}.staff s ON s.id = ss.staff_id "
        "WHERE ss.token = %s AND ss.expires_at > now() AND s.status = 'active'",
        (token,),
    )
    row = cur.fetchone()
    return dict(row) if row else None


def _link(r) -> Dict[str, Any]:
    return {
        'id': r['id'], 'token': r['token'], 'title': r['title'],
        'childName': r['child_name'], 'parentName': r['parent_name'], 'phone': r['phone'],
        'isPublic': r['is_public'], 'active': r['active'], 'maxBookings': r['max_bookings'],
        'createdBy': r['created_by'], 'createdAt': _iso(r['created_at']),
        'bookingsCount': r.get('bookings_count') or 0,
    }


def _slot(r) -> Dict[str, Any]:
    d = r['slot_date']
    out = {
        'id': r['id'], 'date': _iso(d), 'dateRu': _ru(d), 'weekdayName': WEEKDAYS[d.weekday()],
        'timeFrom': r['time_from'], 'timeTo': r['time_to'], 'bookingId': r.get('booking_id'),
    }
    if r.get('child_name') is not None:
        out['childName'] = r['child_name']
        out['parentName'] = r['parent_name']
    return out


def _booking(r) -> Dict[str, Any]:
    d = r['slot_date']
    return {
        'id': r['id'], 'slotId': r['slot_id'], 'date': _iso(d), 'dateRu': _ru(d),
        'weekdayName': WEEKDAYS[d.weekday()], 'timeFrom': r['time_from'], 'timeTo': r['time_to'],
        'childName': r['child_name'], 'childBirthDate': r['child_birth_date'],
        'parentName': r['parent_name'], 'phone': r['phone'], 'telegram': r['telegram'],
        'messengers': r['messengers'], 'comment': r['comment'], 'status': r['status'],
        'statusLabel': STATUS_LABELS.get(r['status'], r['status']),
        'processedBy': r['processed_by'], 'processedAt': _iso(r['processed_at']) or None,
        'createdAt': _iso(r['created_at']),
    }


def _link_by_token(cur, token: str):
    cur.execute(
        f"SELECT l.*, (SELECT count(*) FROM {SCHEMA}.diag_bookings b "
        f"WHERE b.link_id = l.id AND b.status <> 'rejected') AS bookings_count "
        f"FROM {SCHEMA}.diag_booking_links l WHERE l.token = %s",
        (token,),
    )
    return cur.fetchone()


def _link_error(link) -> Optional[Dict[str, Any]]:
    if not link:
        return _resp(404, {'error': 'not_found', 'message': 'Ссылка не найдена'})
    if not link['active']:
        return _resp(410, {'error': 'inactive', 'message': 'Ссылка отключена. Напишите администратору.'})
    return None


def _limit_reached(link) -> bool:
    return not link['is_public'] and (link['bookings_count'] or 0) >= link['max_bookings']


def coverage(cur) -> Dict[str, Any]:
    """Заведены ли окна на 2 недели вперёд: в каждой из двух ближайших недель есть окна."""
    today = _msk_today(cur)
    week2_start = today + timedelta(days=7)
    end = today + timedelta(days=COVERAGE_DAYS - 1)
    cur.execute(
        f"SELECT count(*) FILTER (WHERE slot_date < %s) AS w1, "
        f"count(*) FILTER (WHERE slot_date >= %s) AS w2, "
        f"count(*) FILTER (WHERE booking_id IS NULL) AS free, max(slot_date) AS last "
        f"FROM {SCHEMA}.diag_slots WHERE slot_date BETWEEN %s AND %s",
        (week2_start, week2_start, today, end),
    )
    r = cur.fetchone()
    cur.execute(f"SELECT max(slot_date) AS last FROM {SCHEMA}.diag_slots")
    last = cur.fetchone()['last']
    return {
        'today': _iso(today),
        'isSunday': today.weekday() == 6,
        'enough': bool(r['w1']) and bool(r['w2']),
        'freeInTwoWeeks': r['free'] or 0,
        'lastSlotDate': _iso(last) if last else None,
        'lastSlotDateRu': _ru(last) if last else None,
    }


# ── Родитель ─────────────────────────────────────────────────────────────────

def public_check(cur, params):
    link = _link_by_token(cur, params.get('token') or '')
    err = _link_error(link)
    if err:
        return err
    return _resp(200, {'link': _link(link), 'limitReached': _limit_reached(link)})


def public_slots(cur, params):
    link = _link_by_token(cur, params.get('token') or '')
    err = _link_error(link)
    if err:
        return err
    cur.execute(
        f"SELECT id, slot_date, time_from, time_to, booking_id FROM {SCHEMA}.diag_slots "
        f"WHERE booking_id IS NULL AND (slot_date + time_from::time) > {MSK_NOW} "
        "ORDER BY slot_date, time_from"
    )
    return _resp(200, {'link': _link(link), 'limitReached': _limit_reached(link),
                       'slots': [_slot(r) for r in cur.fetchall()]})


def public_book(cur, body):
    link = _link_by_token(cur, str(body.get('token') or ''))
    err = _link_error(link)
    if err:
        return err
    if _limit_reached(link):
        return _resp(409, {'error': 'limit', 'message': 'По этой ссылке запись уже сделана.'})

    child = str(body.get('childName') or link['child_name'] or '').strip()[:200]
    parent = str(body.get('parentName') or link['parent_name'] or '').strip()[:200]
    phone = re.sub(r'\D', '', str(body.get('phone') or link['phone'] or ''))[:15]
    if not child or not parent or len(phone) < 11:
        return _resp(400, {'error': 'fields', 'message': 'Заполните имя ребёнка, родителя и телефон.'})

    try:
        slot_id = int(body.get('slotId') or 0)
    except (TypeError, ValueError):
        slot_id = 0

    # Сначала занимаем окно одним запросом — двое родителей не возьмут одно время
    cur.execute(
        f"UPDATE {SCHEMA}.diag_slots SET booking_id = -1 "
        f"WHERE id = %s AND booking_id IS NULL AND (slot_date + time_from::time) > {MSK_NOW} "
        "RETURNING id, slot_date, time_from, time_to",
        (slot_id,),
    )
    slot = cur.fetchone()
    if not slot:
        return _resp(409, {'error': 'taken', 'message': 'Это время уже заняли. Выберите другое.'})

    messengers = body.get('messengers') or []
    if not isinstance(messengers, list):
        messengers = []
    cur.execute(
        f"INSERT INTO {SCHEMA}.diag_bookings (slot_id, link_id, slot_date, time_from, time_to, "
        "child_name, child_birth_date, parent_name, phone, telegram, messengers, comment) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *",
        (slot['id'], link['id'], slot['slot_date'], slot['time_from'], slot['time_to'], child,
         str(body.get('childBirthDate') or '')[:20], parent, phone,
         str(body.get('telegram') or '')[:100], ', '.join(str(m) for m in messengers)[:100],
         str(body.get('comment') or '')[:1000]),
    )
    booking = cur.fetchone()
    cur.execute(f"UPDATE {SCHEMA}.diag_slots SET booking_id = %s WHERE id = %s", (booking['id'], slot['id']))
    # Сразу сообщаем «Окну»: админы увидят запись, не дожидаясь опроса
    hook = send_diag_hook(booking)
    mark_diag_hook(cur, booking['id'], hook, SCHEMA)
    return _resp(200, {'ok': True, 'booking': _booking(booking), 'notified': hook.get('ok', False)})


# ── Сотрудники ───────────────────────────────────────────────────────────────

def admin_slots(cur):
    today = _msk_today(cur)
    cur.execute(
        f"SELECT s.id, s.slot_date, s.time_from, s.time_to, s.booking_id, "
        f"b.child_name, b.parent_name FROM {SCHEMA}.diag_slots s "
        f"LEFT JOIN {SCHEMA}.diag_bookings b ON b.id = s.booking_id "
        "WHERE s.slot_date >= %s ORDER BY s.slot_date, s.time_from",
        (today,),
    )
    return _resp(200, {'slots': [_slot(r) for r in cur.fetchall()], 'coverage': coverage(cur)})


def add_slots(cur, body, me):
    """Добавить окна. days: [{date, times: [{from, to}]}] — у каждого дня своё время.
    Старый формат (date/dates + общие times) тоже принимаем. Дубли по времени пропускаем."""
    days = body.get('days')
    if not days:
        raw = body.get('dates') or ([body['date']] if body.get('date') else [])
        days = [{'date': d, 'times': body.get('times') or []} for d in raw]
    plan = []
    today = _msk_today(cur)
    for day in days:
        try:
            d = date.fromisoformat(str(day.get('date') or ''))
        except ValueError:
            return _resp(400, {'error': 'Проверьте даты'})
        if d < today:
            return _resp(400, {'error': f'Дата {_ru(d)} уже прошла'})
        for t in day.get('times') or []:
            tf, tt = str(t.get('from') or ''), str(t.get('to') or '')
            if not TIME_RE.match(tf) or not TIME_RE.match(tt) or tt <= tf:
                return _resp(400, {'error': f'Проверьте время {tf}–{tt} на {_ru(d)}'})
            plan.append((d, tf, tt))
    if not plan:
        return _resp(400, {'error': 'Добавьте хотя бы одно время'})
    added = 0
    for d, tf, tt in plan:
        cur.execute(
            f"INSERT INTO {SCHEMA}.diag_slots (slot_date, time_from, time_to, created_by) "
            "VALUES (%s, %s, %s, %s) ON CONFLICT (slot_date, time_from) DO NOTHING",
            (d, tf, tt, me['full_name']),
        )
        added += cur.rowcount
    return _resp(200, {'ok': True, 'added': added, 'coverage': coverage(cur)})


def delete_slot(cur, params):
    cur.execute(
        f"DELETE FROM {SCHEMA}.diag_slots WHERE id = %s AND booking_id IS NULL",
        (int(params.get('id') or 0),),
    )
    if not cur.rowcount:
        return _resp(409, {'error': 'На это окно уже записались — сначала отмените запись'})
    return _resp(200, {'ok': True, 'coverage': coverage(cur)})


def list_links(cur):
    cur.execute(
        f"SELECT l.*, (SELECT count(*) FROM {SCHEMA}.diag_bookings b "
        f"WHERE b.link_id = l.id AND b.status <> 'rejected') AS bookings_count "
        f"FROM {SCHEMA}.diag_booking_links l ORDER BY l.id DESC LIMIT 300"
    )
    return _resp(200, {'links': [_link(r) for r in cur.fetchall()]})


def create_link(cur, body, me, public=False):
    if public:
        cur.execute(
            f"SELECT l.*, 0 AS bookings_count FROM {SCHEMA}.diag_booking_links l "
            "WHERE is_public ORDER BY id LIMIT 1"
        )
        row = cur.fetchone()
        if row:
            return _resp(200, {'link': _link(row)})
    child = str(body.get('childName') or '').strip()[:200]
    title = 'Запись на диагностику' + (f' — {child}' if child else '')
    cur.execute(
        f"INSERT INTO {SCHEMA}.diag_booking_links (token, title, child_name, parent_name, phone, "
        "is_public, created_by) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *, 0 AS bookings_count",
        (secrets.token_urlsafe(9), title, child, str(body.get('parentName') or '')[:200],
         re.sub(r'\D', '', str(body.get('phone') or ''))[:15], public, me['full_name']),
    )
    return _resp(200, {'link': _link(cur.fetchone())})


def list_bookings(cur, params):
    status = params.get('status') or 'all'
    where = '' if status == 'all' else 'WHERE status = %s'
    cur.execute(
        f"SELECT * FROM {SCHEMA}.diag_bookings {where} ORDER BY created_at DESC LIMIT 300",
        (() if status == 'all' else (status,)),
    )
    rows = [_booking(r) for r in cur.fetchall()]
    cur.execute(f"SELECT count(*) AS n FROM {SCHEMA}.diag_bookings WHERE status = 'new'")
    return _resp(200, {'bookings': rows, 'newCount': cur.fetchone()['n']})


def set_status(cur, body, me, notify_window: bool = True):
    status = body.get('status')
    if status not in STATUS_LABELS:
        return _resp(400, {'error': 'bad status'})
    bid = int(body.get('id') or 0)
    cur.execute(
        f"UPDATE {SCHEMA}.diag_bookings SET status = %s, processed_by = %s, "
        "processed_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
        (status, me['full_name'], bid),
    )
    row = cur.fetchone()
    if not row:
        return _resp(404, {'error': 'not found'})
    # Отменили запись — окно снова свободно. Вернули — занимаем, если никто не взял
    if status == 'rejected':
        cur.execute(f"UPDATE {SCHEMA}.diag_slots SET booking_id = NULL WHERE booking_id = %s", (bid,))
    else:
        cur.execute(
            f"UPDATE {SCHEMA}.diag_slots SET booking_id = %s WHERE id = %s AND booking_id IS NULL",
            (bid, row['slot_id']),
        )
    # Статус меняется и в карточке «Окна». Если меняло само «Окно» — обратно не шлём
    if notify_window:
        send_diag_hook(row, 'diag_booking_status')
    return _resp(200, {'booking': _booking(row)})


def _service_ok(event) -> bool:
    key = os.environ.get('INTERACTION_SERVICE_KEY') or ''
    for name, value in (event.get('headers') or {}).items():
        if str(name).lower() == 'x-service-key':
            return bool(key) and secrets.compare_digest(str(value or ''), key)
    return False


def feed(cur, params):
    """Страховочная выгрузка для «Окна». status=new — ещё не доставленные
    (отданные помечаются доставленными), all — последние записи целиком."""
    status = params.get('status') or 'new'
    where = 'WHERE interaction_sent_at IS NULL' if status == 'new' else ''
    cur.execute(f"SELECT * FROM {SCHEMA}.diag_bookings {where} ORDER BY created_at DESC LIMIT 200")
    rows = cur.fetchall()
    items = [diag_payload(r) for r in rows]
    if status == 'new' and rows:
        cur.execute(
            f"UPDATE {SCHEMA}.diag_bookings SET interaction_sent_at = CURRENT_TIMESTAMP WHERE id = ANY(%s)",
            ([r['id'] for r in rows],),
        )
    return _resp(200, {'bookings': items})


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Запись родителей на диагностику по окошкам руководителей."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': '', 'isBase64Encoded': False}

    params = event.get('queryStringParameters') or {}
    action = params.get('action') or ''
    body = json.loads(event.get('body') or '{}') if method == 'POST' else {}

    conn = _conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if method == 'GET' and action == 'check':
            return public_check(cur, params)
        if method == 'GET' and action == 'slots':
            return public_slots(cur, params)
        if method == 'POST' and action == 'book':
            return public_book(cur, body)
        if method == 'GET' and action == 'feed':
            if not _service_ok(event):
                return _resp(401, {'error': 'unauthorized'})
            return feed(cur, params)
        # «Окно» подтверждает или отменяет запись из карточки в чате
        if method == 'POST' and action == 'set-status' and _service_ok(event):
            who = str(body.get('processedBy') or 'Окно взаимодействия').strip()[:200]
            return set_status(cur, body, {'full_name': who}, notify_window=False)

        me = _me(cur, event)
        if not me or me['role'] not in ('head', 'admin'):
            return _resp(401, {'error': 'Нужен вход в админку'})
        is_head = me['role'] == 'head'

        if method == 'GET' and action == 'admin-slots':
            return admin_slots(cur)
        if method == 'GET' and action == 'coverage':
            return _resp(200, coverage(cur))
        if action in ('add-slots', 'delete-slot') and not is_head:
            return _resp(403, {'error': 'Окна заводят только руководители'})
        if method == 'POST' and action == 'add-slots':
            return add_slots(cur, body, me)
        if method == 'DELETE' and action == 'delete-slot':
            return delete_slot(cur, params)
        if method == 'GET' and action == 'links':
            return list_links(cur)
        if method == 'POST' and action == 'create-link':
            return create_link(cur, body, me)
        if method == 'POST' and action == 'public-link':
            return create_link(cur, body, me, public=True)
        if method == 'POST' and action == 'toggle-link':
            cur.execute(f"UPDATE {SCHEMA}.diag_booking_links SET active = NOT active WHERE id = %s",
                        (int(body.get('id') or 0),))
            return _resp(200, {'ok': True})
        if method == 'DELETE' and action == 'delete-link':
            cur.execute(f"UPDATE {SCHEMA}.diag_booking_links SET active = FALSE WHERE id = %s",
                        (int(params.get('id') or 0),))
            return _resp(200, {'ok': True})
        if method == 'GET' and action == 'bookings':
            return list_bookings(cur, params)
        if method == 'POST' and action == 'set-status':
            return set_status(cur, body, me)
        return _resp(404, {'error': 'unknown action'})
    finally:
        cur.close()
        conn.close()
