'''
Business: Бронирование индивидуальных окон родителем по персональной ссылке
и обработка заявок администратором (подтвердить / отклонить).
Args: event (httpMethod, queryStringParameters, body); context.request_id
Returns: JSON со списком ссылок, броней или результатом операции
'''
import json
import os
import re
import secrets
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta
from typing import Any, Dict, Optional

import urllib.error
import urllib.request

import psycopg2
import psycopg2.extras
import requests

import week_slots
from name_match import same_child

SCHEDULE_URL = 'https://functions.poehali.dev/6d9e6094-fd18-47ec-b45f-ad3ee4ba7cc2'
# Окно взаимодействия — туда сразу сообщаем о новой брони
INTERACTION_HOOK_URL = (
    'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1?action=booking-hook'
)
INTERACTIONS_URL = 'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

WEEKDAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

STATUS_LABELS = {
    'new': 'Новая',
    'confirmed': 'Подтверждена',
    'rejected': 'Отклонена',
}


def _resp(status: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(payload, ensure_ascii=False, default=str),
    }


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _norm_phone(raw: Optional[str]) -> str:
    digits = re.sub(r'\D', '', raw or '')
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits


def _fmt_ru(iso: str) -> str:
    try:
        d = datetime.strptime(iso[:10], '%Y-%m-%d').date()
        return d.strftime('%d.%m.%Y')
    except Exception:
        return iso or ''


def _weekday_name(iso: str) -> str:
    try:
        d = datetime.strptime(iso[:10], '%Y-%m-%d').date()
        return WEEKDAY_NAMES[d.weekday()]
    except Exception:
        return ''


def _row_to_link(r) -> Dict[str, Any]:
    return {
        'id': r['id'],
        'token': r['token'],
        'title': r['title'] or '',
        'note': r['note'] or '',
        'parentName': r['parent_name'] or '',
        'childName': r['child_name'] or '',
        'phone': r['phone'] or '',
        'active': bool(r['active']),
        'isPublic': bool(r.get('is_public')),
        'expiresAt': str(r['expires_at'])[:10] if r['expires_at'] else None,
        'maxBookings': r['max_bookings'],
        'createdBy': r['created_by'] or '',
        'createdAt': r['created_at'].isoformat() if r['created_at'] else None,
        'bookingsCount': r.get('bookings_count', 0),
    }


def _row_to_booking(r) -> Dict[str, Any]:
    return {
        'id': r['id'],
        'token': r['token'],
        'date': str(r['slot_date'])[:10],
        'dateRu': _fmt_ru(str(r['slot_date'])),
        'weekdayName': _weekday_name(str(r['slot_date'])),
        'timeFrom': r['time_from'],
        'timeTo': r['time_to'],
        'teacherId': r['teacher_id'],
        'teacherName': r['teacher_name'] or '',
        'childName': r['child_name'] or '',
        'parentName': r['parent_name'] or '',
        'phone': r['phone'] or '',
        'comment': r['comment'] or '',
        'batchId': r.get('batch_id'),
        'lessonType': r.get('lesson_type') or 'individual',
        'startFrom': str(r['start_from'])[:10] if r.get('start_from') else None,
        'status': r['status'],
        'statusLabel': STATUS_LABELS.get(r['status'], r['status']),
        'adminNote': r['admin_note'] or '',
        'dialogId': r['dialog_id'],
        'createdAt': r['created_at'].isoformat() if r['created_at'] else None,
        'processedAt': r['processed_at'].isoformat() if r['processed_at'] else None,
        'processedBy': r['processed_by'] or '',
    }


def _fetch_free_slots(date_from: str, date_to: str) -> list:
    '''Свободные индивидуальные окна из расписания за период.'''
    try:
        r = requests.get(
            SCHEDULE_URL,
            params={'mode': 'ind_week', 'date_from': date_from, 'date_to': date_to},
            timeout=20,
        )
        r.raise_for_status()
        return r.json().get('days', [])
    except Exception as e:
        print(f'schedule fetch failed: {e}')
        return []


def _fetch_group_rows(date_from: str, date_to: str) -> Dict[str, Any]:
    '''Групповые занятия недели: строки таблицы со свободными местами.'''
    try:
        r = requests.get(
            SCHEDULE_URL,
            params={'mode': 'groups_week', 'date_from': date_from, 'date_to': date_to},
            timeout=25,
        )
        r.raise_for_status()
        return r.json() or {}
    except Exception as e:
        print(f'groups fetch failed: {e}')
        return {}


def _booked_keys(cur) -> set:
    '''Индивидуальные окна, занятые активными заявками.

    Ключ — ДЕНЬ НЕДЕЛИ, а не дата: ребёнок ходит к педагогу каждую неделю,
    поэтому «понедельник в 15:00» занят и на следующих неделях тоже.

    Групповые заявки окно не закрывают: в группе несколько мест, и записаться
    туда может ещё не одна семья.
    '''
    cur.execute(
        "SELECT slot_date, time_from, teacher_id FROM slot_bookings "
        "WHERE status IN ('new', 'confirmed') AND lesson_type = 'individual'"
    )
    return {
        (r['slot_date'].weekday(), r['time_from'], int(r['teacher_id']))
        for r in cur.fetchall()
    }


def _mark_in_crm(rows: list) -> None:
    '''Проставляем броням признак inCrm — ребёнка уже завели в CRM.

    Нужно расписанию администратора: пока ученика не завели, бронь показываем
    пометкой «бронь», а после заведения он появляется обычной строкой — и
    дублировать его броней нельзя.

    Расписание в CRM — источник правды. Администратор, заводя ребёнка,
    нередко ставит его в соседнее время или к другому педагогу, чем было
    в заявке. Поэтому мало сверять бронь с тем же слотом: если ребёнок
    появился в расписании ГДЕ УГОДНО на этой неделе, заявка уже отработана
    и показывать её броней нельзя.
    '''
    groups = [b for b in rows if b.get('lessonType') == 'groups']
    if not groups:
        return
    dates = [b['date'] for b in groups if b.get('date')]
    if not dates:
        return
    week = _fetch_group_rows(min(dates), max(dates))
    names = {int(k): v for k, v in (week.get('student_names') or {}).items()}

    # (день недели, время, педагог) → имена учеников группы в CRM
    crm: Dict[tuple, list] = {}
    for r in week.get('rows') or []:
        time = r.get('time') or ''
        teacher = int(r.get('teacher_id') or 0)
        for cell in (r.get('cells') or {}).values():
            iso = (cell.get('date') or '')[:10]
            if not iso:
                continue
            wd = datetime.strptime(iso, '%Y-%m-%d').date().weekday()
            crm.setdefault((wd, time, teacher), []).extend(
                names.get(int(s), '') for s in (cell.get('student_ids') or [])
            )

    # Все имена из расписания CRM за неделю — независимо от слота.
    crm_all = [nm for slot_names in crm.values() for nm in slot_names if nm]

    for b in groups:
        child = b.get('childName')
        # Ребёнок есть в расписании CRM — неважно, в этом слоте или в другом:
        # значит, заявку уже провели руками, и бронь дублирует живую строку.
        b['inCrm'] = any(same_child(child, nm) for nm in crm_all)


def _group_booked(cur) -> Dict[tuple, list]:
    '''Дети, занявшие места в группах по нашим заявкам.

    CRM про эти заявки не знает: ребёнка туда заводят только после
    подтверждения. Без учёта родитель видит «свободно 6 из 6», хотя часть
    мест уже разобрана.

    Возвращаем именно имена, а не количество: если ребёнка уже завели в CRM,
    его нельзя посчитать второй раз — иначе одно место съедается дважды.

    Ключ — день недели: ребёнок ходит в группу каждую неделю, поэтому место
    занято и на следующих неделях.
    '''
    cur.execute(
        "SELECT DISTINCT slot_date, time_from, teacher_id, child_name FROM slot_bookings "
        "WHERE status IN ('new', 'confirmed') AND lesson_type = 'groups'"
    )
    out: Dict[tuple, list] = {}
    for r in cur.fetchall():
        key = (r['slot_date'].weekday(), r['time_from'], int(r['teacher_id']))
        out.setdefault(key, []).append(r['child_name'] or '')
    return out


def _find_dialog_by_child(cur, child: str) -> Optional[int]:
    '''Ищем диалог родителя по имени ребёнка.

    Родитель на форме указывает только имя ребёнка, причём как ему удобно:
    «Маша Иванова», «Иванова Мария Сергеевна», иногда с опечаткой. Разбор
    имени и сравнение живут в name_match — там же покрыты уменьшительные
    формы и порядок слов.
    '''
    if not (child or '').strip():
        return None

    cur.execute(
        "SELECT id, child_name FROM interaction_dialogs "
        "WHERE child_name IS NOT NULL AND child_name <> '' ORDER BY id"
    )
    for r in cur.fetchall():
        if same_child(child, r['child_name']):
            return int(r['id'])
    return None


def _notify_interaction(bookings: list) -> dict:
    '''Сообщаем окну взаимодействия о новой брони сразу после её создания.

    Окно живёт в отдельном проекте со своей базой, поэтому пишем ему по HTTP.
    Дальше окно само находит ученика в CRM, создаёт чат, показывает карточку
    брони и шлёт уведомление админам в Max/Telegram.
    '''
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        print('booking-hook: INTERACTION_SERVICE_KEY не задан')
        return {'sent': False, 'error': 'no_service_key'}
    if not bookings:
        return {'sent': False, 'error': 'no_bookings'}

    first = bookings[0]
    payload = {
        'event': 'booking_created',
        'batchId': first.get('batchId'),
        'child': {
            'name': first.get('childName') or '',
            'parentName': first.get('parentName') or '',
            'phone': first.get('phone') or '',
        },
        'startFrom': first.get('startFrom') or first.get('date'),
        'createdAt': first.get('createdAt'),
        'lessons': [
            {
                'id': b.get('id'),
                'lessonType': b.get('lessonType'),
                'weekday': b.get('weekdayName'),
                'date': b.get('date'),
                'timeFrom': b.get('timeFrom'),
                'timeTo': b.get('timeTo'),
                'teacherId': b.get('teacherId'),
                'teacherName': b.get('teacherName'),
            }
            for b in bookings
        ],
    }

    req = urllib.request.Request(
        INTERACTION_HOOK_URL,
        data=json.dumps(payload, ensure_ascii=False).encode(),
        headers={'Content-Type': 'application/json', 'X-Service-Key': key},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            code = resp.status
            body = json.loads(resp.read().decode() or '{}')
        print(f'booking-hook -> {code} {json.dumps(body, ensure_ascii=False)}')
        return {'sent': True, 'status': code, 'response': body}
    except urllib.error.HTTPError as e:
        text = e.read().decode(errors='replace')[:300]
        print(f'booking-hook -> HTTP {e.code} {text}')
        return {'sent': False, 'status': e.code, 'error': text}
    except Exception as e:
        print(f'booking-hook failed: {e}')
        return {'sent': False, 'error': str(e)}


def _push_to_interactions(cur, booking: Dict[str, Any], phone: str) -> Optional[int]:
    '''Заводим диалог в окне взаимодействия и кладём туда текст заявки.

    Пишем напрямую в таблицы окна взаимодействия: у функции взаимодействий
    свои сессии сотрудников, а бронь приходит от неавторизованного родителя.
    Телефон необязателен — если его нет, ищем родителя по имени ребёнка.
    '''
    digits = _norm_phone(phone)
    if len(digits) != 11:
        digits = ''

    parent = (booking.get('parentName') or '').strip() or None
    child = (booking.get('childName') or '').strip() or None
    display = parent or child or digits or 'Заявка на занятие'

    try:
        row = None
        if digits:
            # Клиент мог уже писать в Max/Telegram — не плодим дубли
            cur.execute(
                "SELECT id FROM interaction_dialogs "
                "WHERE chat_id = %s OR phone = %s ORDER BY id LIMIT 1",
                (digits, digits),
            )
            row = cur.fetchone()

        dialog_id = int(row['id']) if row else _find_dialog_by_child(cur, child)

        if dialog_id:
            cur.execute(
                "UPDATE interaction_dialogs SET crm_name = COALESCE(crm_name, %s), "
                "child_name = COALESCE(child_name, %s), "
                "phone = COALESCE(NULLIF(%s, ''), phone), hidden = false "
                "WHERE id = %s",
                (parent, child, digits, dialog_id),
            )
        else:
            cur.execute(
                "INSERT INTO interaction_dialogs "
                "(channel, chat_id, client_name, phone, crm_name, child_name, "
                "crm_status, crm_label, last_time) "
                "VALUES ('max', %s, %s, %s, %s, %s, 'lead', 'Лид', now()) RETURNING id",
                (digits or f"booking-{booking.get('id')}", display, digits, parent, child),
            )
            dialog_id = cur.fetchone()['id']

        # Родитель мог выбрать несколько занятий — пишем их одним сообщением
        items = booking.get('items') or [booking]
        lines = [
            'Заявка на занятия' if len(items) > 1 else 'Заявка на занятие',
            f"Ребёнок: {child or '—'}",
            f"Начало: с {booking.get('dateRu')}",
            '',
        ]
        for it in items:
            kind = 'группа' if it.get('lessonType') == 'groups' else 'индивидуально'
            lines.append(
                f"• {it.get('weekdayName')} {it.get('timeFrom')}–{it.get('timeTo')}"
                f" — {it.get('teacherName') or '—'} ({kind})"
            )
        if parent:
            lines.append(f'Родитель: {parent}')
        if booking.get('comment'):
            lines.append(f"Комментарий: {booking['comment']}")

        cur.execute(
            "INSERT INTO interaction_messages (dialog_id, direction, channel, text, author) "
            "VALUES (%s, 'in', 'max', %s, %s)",
            (int(dialog_id), '\n'.join(lines), 'Бронирование'),
        )
        cur.execute(
            "UPDATE interaction_dialogs SET unread = unread + 1, last_time = now() WHERE id = %s",
            (int(dialog_id),),
        )
        return int(dialog_id)
    except Exception as e:
        print(f'push to interactions failed: {e}')
        return None


def handler(event: dict, context) -> dict:
    '''Бронирование окон: персональные ссылки, заявки родителей, обработка админом'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action') or ''
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}

    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        # ── Персональные ссылки (админ) ───────────────────────────────────────
        if method == 'GET' and action == 'links':
            cur.execute(
                "SELECT l.*, (SELECT COUNT(*) FROM slot_bookings b WHERE b.token = l.token) "
                "AS bookings_count FROM booking_links l ORDER BY l.created_at DESC"
            )
            return _resp(200, {'links': [_row_to_link(r) for r in cur.fetchall()]})

        if method == 'POST' and action == 'public-link':
            # Общая ссылка одна на школу: если уже есть — отдаём её же,
            # чтобы у администраторов не расплодились разные адреса
            cur.execute(
                "SELECT l.*, (SELECT COUNT(*) FROM slot_bookings b WHERE b.token = l.token) "
                "AS bookings_count FROM booking_links l WHERE l.is_public "
                "ORDER BY l.id LIMIT 1"
            )
            row = cur.fetchone()
            if not row:
                cur.execute(
                    "INSERT INTO booking_links (token, title, note, max_bookings, "
                    "created_by, is_public) VALUES (%s, %s, %s, %s, %s, true) RETURNING *",
                    (
                        secrets.token_urlsafe(9),
                        'Запись на занятие',
                        '',
                        1,
                        (body.get('createdBy') or '').strip(),
                    ),
                )
                row = dict(cur.fetchone(), bookings_count=0)
                conn.commit()
            return _resp(200, {'ok': True, 'link': _row_to_link(row)})

        if method == 'POST' and action == 'create-link':
            token = secrets.token_urlsafe(9)
            is_public = bool(body.get('isPublic'))
            cur.execute(
                "INSERT INTO booking_links (token, title, note, parent_name, child_name, "
                "phone, expires_at, max_bookings, created_by, is_public) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *",
                (
                    token,
                    (body.get('title') or '').strip(),
                    (body.get('note') or '').strip(),
                    (body.get('parentName') or '').strip(),
                    (body.get('childName') or '').strip(),
                    _norm_phone(body.get('phone')),
                    body.get('expiresAt') or None,
                    int(body.get('maxBookings') or 1),
                    (body.get('createdBy') or '').strip(),
                    is_public,
                ),
            )
            row = cur.fetchone()
            conn.commit()
            return _resp(200, {'ok': True, 'link': _row_to_link(dict(row, bookings_count=0))})

        if method == 'POST' and action == 'toggle-link':
            cur.execute(
                "UPDATE booking_links SET active = NOT active WHERE id = %s RETURNING active",
                (int(body.get('id')),),
            )
            row = cur.fetchone()
            conn.commit()
            return _resp(200, {'ok': True, 'active': row['active'] if row else None})

        if method == 'DELETE' and action == 'link':
            cur.execute("DELETE FROM booking_links WHERE id = %s", (int(params.get('id')),))
            conn.commit()
            return _resp(200, {'ok': True})

        # ── Страница родителя: проверка ссылки и свободные окна ───────────────
        if method == 'GET' and action == 'slots':
            token = (params.get('token') or '').strip()
            if not token:
                return _resp(400, {'error': 'no_token'})
            cur.execute("SELECT * FROM booking_links WHERE token = %s", (token,))
            link = cur.fetchone()
            if not link:
                return _resp(404, {'error': 'link_not_found', 'message': 'Ссылка не найдена'})
            if not link['active']:
                return _resp(403, {'error': 'link_disabled', 'message': 'Ссылка больше не действует'})
            if link['expires_at'] and link['expires_at'] < date.today():
                return _resp(403, {'error': 'link_expired', 'message': 'Срок действия ссылки истёк'})

            # Считаем заявки по каждому типу отдельно: индивидуальное и
            # групповое занятие родитель выбирает независимо
            cur.execute(
                "SELECT lesson_type, COUNT(*) AS n FROM slot_bookings WHERE token = %s "
                "AND status IN ('new', 'confirmed') GROUP BY lesson_type",
                (token,),
            )
            by_type = {r['lesson_type']: r['n'] for r in cur.fetchall()}
            used = sum(by_type.values())
            # Дети ходят по 3–4 раза в неделю, поэтому число занятий не
            # ограничиваем: родитель отмечает столько окон, сколько нужно
            done_individual = False
            done_groups = False

            if done_individual and done_groups:
                return _resp(200, {
                    'link': _row_to_link(dict(link, bookings_count=used)),
                    'individualDays': [],
                    'groupDays': [],
                    'limitReached': True,
                })

            # Родитель говорит, с какого числа готов начать. Раньше завтрашнего
            # дня не пускаем: сегодня расписание уже сверстано.
            tomorrow = date.today() + timedelta(days=1)
            start = week_slots.parse_date(params.get('start_from'))
            if start < tomorrow:
                start = tomorrow

            lesson_type = (params.get('lesson_type') or 'individual').strip()
            # Тип, по которому родитель уже записался, второй раз не показываем
            if done_individual and lesson_type in ('individual', 'both'):
                lesson_type = 'groups' if lesson_type == 'both' else 'none'
            if done_groups and lesson_type in ('groups', 'both'):
                lesson_type = 'individual' if lesson_type == 'both' else 'none'
            taken = _booked_keys(cur)

            ind_days: list = []
            group_days: list = []

            # Смотрим четыре недели вперёд: предлагаем только те окна, которые
            # свободны регулярно, а не один раз.
            #
            # Индивидуальные расписание отдаёт за любой период сразу, а группы —
            # ТОЛЬКО понедельно: при длинном диапазоне ячейки разных недель
            # ложатся в один день и затирают друг друга. Поэтому группы просим
            # неделя за неделей. Все запросы идут параллельно, иначе функция
            # не укладывается в лимит времени.
            df = week_slots.fmt(start)
            dt = week_slots.fmt(week_slots.date_to(start))
            starts = week_slots.week_starts(start)

            with ThreadPoolExecutor(max_workers=5) as pool:
                ind_future = (
                    pool.submit(_fetch_free_slots, df, dt)
                    if lesson_type in ('individual', 'both') else None
                )
                # Раньше группы просили понедельно — четыре тяжёлых запроса,
                # и функция не укладывалась в лимит. Теперь расписание само
                # отдаёт разбивку по неделям одним ответом.
                grp_future = (
                    pool.submit(
                        _fetch_group_rows,
                        df,
                        week_slots.fmt(starts[-1] + timedelta(days=6)),
                    )
                    if lesson_type in ('groups', 'both') else None
                )

                if ind_future:
                    ind_days = week_slots.build_individual(ind_future.result(), start, taken)
                if grp_future:
                    payload = grp_future.result() or {}
                    weeks_data = payload.get('weeks')
                    if weeks_data:
                        raw_weeks = [
                            {
                                'rows': wk,
                                'max_size': payload.get('max_size'),
                                'student_names': payload.get('student_names'),
                            }
                            for wk in weeks_data
                        ]
                    else:
                        raw_weeks = [payload] if payload else []
                    max_size = next((int(r.get('max_size') or 6) for r in raw_weeks if r), 6)
                    crm_names: Dict[int, str] = {}
                    for r in raw_weeks:
                        for sid, nm in (r.get('student_names') or {}).items():
                            crm_names[int(sid)] = nm
                    group_days = week_slots.build_groups(
                        [r.get('rows') or [] for r in raw_weeks],
                        start,
                        max_size,
                        _group_booked(cur),
                        crm_names,
                    )

            return _resp(200, {
                'link': _row_to_link(dict(link, bookings_count=used)),
                'startFrom': week_slots.fmt(start),
                'minDate': week_slots.fmt(tomorrow),
                'individualDays': ind_days,
                'groupDays': group_days,
                'doneIndividual': done_individual,
                'doneGroups': done_groups,
                'limitReached': False,
            })

        # ── Родитель бронирует окна ───────────────────────────────────────────
        if method == 'POST' and action == 'book':
            token = (body.get('token') or '').strip()
            child = (body.get('childName') or '').strip()

            # Родитель выбирает сразу несколько занятий — принимаем списком.
            # Одиночная форма тоже поддерживается: старые ссылки могли остаться
            # открытыми в браузере.
            slots = body.get('slots')
            if not isinstance(slots, list) or not slots:
                slots = [body]

            if not token or not child:
                return _resp(400, {'error': 'bad_request', 'message': 'Заполните имя ребёнка и выберите окно'})

            cur.execute("SELECT * FROM booking_links WHERE token = %s", (token,))
            link = cur.fetchone()
            if not link or not link['active']:
                return _resp(403, {'error': 'link_disabled', 'message': 'Ссылка недействительна'})
            if link['expires_at'] and link['expires_at'] < date.today():
                return _resp(403, {'error': 'link_expired', 'message': 'Срок действия ссылки истёк'})

            start_from = (body.get('startFrom') or '').strip()[:10] or None
            parent_name = (body.get('parentName') or link['parent_name'] or '').strip()
            phone = _norm_phone(body.get('phone') or link['phone'])
            comment = (body.get('comment') or '').strip()
            # Общий номер заявки: все выбранные занятия — одна карточка у админа
            batch_id = secrets.token_urlsafe(8)

            prepared = []
            for s in slots:
                slot_date = (s.get('date') or '').strip()[:10]
                time_from = (s.get('timeFrom') or '').strip()[:5]
                time_to = (s.get('timeTo') or '').strip()[:5]
                teacher_id = s.get('teacherId')
                if not slot_date or not time_from or teacher_id is None:
                    return _resp(400, {'error': 'bad_request', 'message': 'Выберите время занятия'})

                lesson_type = 'groups' if s.get('lessonType') == 'groups' else 'individual'

                # Занятия регулярные, поэтому сверяем ДЕНЬ НЕДЕЛИ: «понедельник
                # в 15:00» занят на все недели, а не только на конкретную дату
                if lesson_type == 'individual':
                    cur.execute(
                        "SELECT id FROM slot_bookings WHERE EXTRACT(DOW FROM slot_date) = "
                        "EXTRACT(DOW FROM %s::date) AND time_from = %s "
                        "AND teacher_id = %s AND lesson_type = 'individual' "
                        "AND status IN ('new', 'confirmed')",
                        (slot_date, time_from, int(teacher_id)),
                    )
                    if cur.fetchone():
                        return _resp(409, {'error': 'taken', 'message': 'Это окно только что забронировали. Выберите другое'})
                else:
                    # В группу один и тот же ребёнок дважды не записывается
                    cur.execute(
                        "SELECT id FROM slot_bookings WHERE EXTRACT(DOW FROM slot_date) = "
                        "EXTRACT(DOW FROM %s::date) AND time_from = %s "
                        "AND teacher_id = %s AND lesson_type = 'groups' AND child_name = %s "
                        "AND status IN ('new', 'confirmed')",
                        (slot_date, time_from, int(teacher_id), child),
                    )
                    if cur.fetchone():
                        return _resp(409, {'error': 'taken', 'message': 'Вы уже записаны на это занятие'})

                prepared.append((
                    token, slot_date, time_from, time_to or time_from, int(teacher_id),
                    (s.get('teacherName') or '').strip(),
                    child, parent_name, phone, comment, lesson_type, start_from, batch_id,
                ))

            rows = []
            for args in prepared:
                cur.execute(
                    "INSERT INTO slot_bookings (token, slot_date, time_from, time_to, "
                    "teacher_id, teacher_name, child_name, parent_name, phone, comment, "
                    "lesson_type, start_from, batch_id) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *",
                    args,
                )
                rows.append(cur.fetchone())
            conn.commit()

            bookings = [_row_to_booking(r) for r in rows]
            main = dict(bookings[0], items=bookings)

            dialog_id = _push_to_interactions(cur, main, phone)
            if dialog_id:
                cur.execute("UPDATE slot_bookings SET dialog_id = %s WHERE batch_id = %s",
                            (dialog_id, batch_id))
                for b in bookings:
                    b['dialogId'] = dialog_id
            conn.commit()

            # Сразу сообщаем окну взаимодействия — админы увидят бронь и
            # получат уведомление, не дожидаясь опроса
            notified = _notify_interaction(bookings)

            return _resp(200, {
                'ok': True,
                'booking': bookings[0],
                'bookings': bookings,
                'notified': notified.get('sent', False),
            })

        # ── Список броней (админ + окно взаимодействия) ───────────────────────
        if method == 'GET' and action in ('bookings', 'feed'):
            status = params.get('status') or ''
            sql = "SELECT * FROM slot_bookings"
            args = []
            if status and status != 'all':
                sql += " WHERE status = %s"
                args.append(status)
            sql += " ORDER BY created_at DESC, time_from LIMIT 500"
            cur.execute(sql, args)
            rows = [_row_to_booking(r) for r in cur.fetchall()]

            # Занятия одной отправки собираем в одну карточку: родитель выбрал
            # 3 окна — администратор видит одну заявку с тремя занятиями
            groups: Dict[str, dict] = {}
            items = []
            for b in rows:
                key = b.get('batchId')
                if not key:
                    items.append(dict(b, lessons=[b]))
                    continue
                if key in groups:
                    groups[key]['lessons'].append(b)
                else:
                    groups[key] = dict(b, lessons=[b])
                    items.append(groups[key])

            cur.execute(
                "SELECT COUNT(DISTINCT COALESCE(batch_id, id::text)) AS n "
                "FROM slot_bookings WHERE status = 'new'"
            )
            new_count = cur.fetchone()['n']

            # Отмечаем брони, чей ребёнок уже заведён в эту группу в CRM:
            # в расписании такую бронь второй раз показывать не нужно
            if params.get('match_crm') == '1':
                _mark_in_crm(rows)

            return _resp(200, {'bookings': items, 'newCount': new_count})

        # ── Админ обрабатывает бронь ──────────────────────────────────────────
        if method == 'POST' and action == 'set-status':
            new_status = (body.get('status') or '').strip()
            if new_status not in STATUS_LABELS:
                return _resp(400, {'error': 'bad_status'})
            # Заявка обрабатывается целиком: все занятия одной отправки
            cur.execute(
                "UPDATE slot_bookings SET status = %s, admin_note = COALESCE(%s, admin_note), "
                "processed_at = now(), processed_by = %s "
                "WHERE id = %s OR (batch_id IS NOT NULL AND batch_id = "
                "(SELECT batch_id FROM slot_bookings WHERE id = %s)) RETURNING *",
                (
                    new_status,
                    body.get('adminNote'),
                    (body.get('processedBy') or '').strip(),
                    int(body.get('id')),
                    int(body.get('id')),
                ),
            )
            rows = cur.fetchall()
            conn.commit()
            if not rows:
                return _resp(404, {'error': 'not_found'})
            return _resp(200, {'ok': True, 'booking': _row_to_booking(rows[0])})

        if method == 'DELETE' and action == 'booking':
            # Удаляем заявку целиком, а не одно занятие из неё
            bid = int(params.get('id'))
            cur.execute(
                "DELETE FROM slot_bookings WHERE id = %s OR (batch_id IS NOT NULL "
                "AND batch_id = (SELECT batch_id FROM slot_bookings WHERE id = %s))",
                (bid, bid),
            )
            conn.commit()
            return _resp(200, {'ok': True})

        return _resp(400, {'error': 'unknown_action', 'action': action})
    finally:
        cur.close()
        conn.close()