import os
import json
import base64
import uuid
import time
import urllib.parse
import urllib.request
import urllib.error
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Optional

import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p93118852_lineaschool_initiati'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Service-Key, X-Admin-Password',
    'Access-Control-Max-Age': '86400',
}

FIELDS = (
    "t.id, t.title, t.description, t.author_id, a.full_name AS author_name, t.assignee_id, "
    "CASE WHEN t.for_shift THEN 'Админ на смене' ELSE s.full_name END AS assignee_name, t.for_shift, "
    "d.full_name AS done_by_name, t.due_date, t.urgency, t.status, t.done_at, t.done_comment, t.created_at, t.attachments, t.is_problem, t.reporter_name, t.original, t.edited_at"
)
FROM = (
    f"FROM {SCHEMA}.staff_tasks t JOIN {SCHEMA}.staff a ON a.id = t.author_id "
    f"JOIN {SCHEMA}.staff s ON s.id = t.assignee_id LEFT JOIN {SCHEMA}.staff d ON d.id = t.done_by"
)
SHIFT_ID = 0
SHARED_PASSWORD = '426874'
SHIFT_ROLES = ('admin', 'head')
ORDER = "ORDER BY (t.status = 'done'), CASE t.urgency WHEN 'urgent' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, t.due_date NULLS LAST, t.created_at DESC"


def _json(payload: Dict[str, Any], code: int = 200) -> Dict[str, Any]:
    return {
        'statusCode': code,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(payload, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def _me(cur, event) -> Optional[Dict[str, Any]]:
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        pwd = headers.get('X-Admin-Password') or headers.get('x-admin-password')
        if pwd and pwd == SHARED_PASSWORD:
            cur.execute(
                f"SELECT id, full_name, role FROM {SCHEMA}.staff WHERE phone = 'shared-teacher' AND status = 'system'"
            )
            return cur.fetchone()
        return None
    cur.execute(
        f"SELECT s.id, s.full_name, s.role FROM {SCHEMA}.staff_sessions ss "
        f"JOIN {SCHEMA}.staff s ON s.id = ss.staff_id "
        "WHERE ss.token = %s AND ss.expires_at > now() AND s.status = 'active'",
        (token,),
    )
    return cur.fetchone()


URGENCIES = ('urgent', 'medium', 'low')


def _urgency(value) -> str:
    return value if value in URGENCIES else 'medium'


MSK = timezone(timedelta(hours=3))


def _with_msk(rows):
    for r in rows:
        c = r.get('created_at')
        r['created_msk'] = c.replace(tzinfo=c.tzinfo or timezone.utc).astimezone(MSK).strftime('%d.%m.%Y %H:%M') if c else ''
    return rows


def _msk(c) -> str:
    return c.replace(tzinfo=c.tzinfo or timezone.utc).astimezone(MSK).strftime('%d.%m.%Y %H:%M') if c else ''


def _with_comments(cur, rows):
    """Подгрузить комментарии ко всем задачам одним запросом."""
    ids = tuple(r['id'] for r in rows)
    by_task: Dict[int, list] = {}
    if ids:
        cur.execute(
            f"SELECT c.id, c.task_id, c.author_id, s.full_name AS author_name, c.text, c.created_at "
            f"FROM {SCHEMA}.staff_task_comments c JOIN {SCHEMA}.staff s ON s.id = c.author_id "
            "WHERE c.task_id IN %s ORDER BY c.created_at, c.id",
            (ids,),
        )
        for c in cur.fetchall():
            c['created_msk'] = _msk(c['created_at'])
            by_task.setdefault(c['task_id'], []).append(c)
    for r in rows:
        r['comments'] = by_task.get(r['id'], [])
        r['edited_msk'] = _msk(r.get('edited_at'))
    return rows


def _task(cur, task_id: int):
    cur.execute(f"SELECT {FIELDS} {FROM} WHERE t.id = %s", (task_id,))
    return cur.fetchone()


def _is_on_shift(cur, staff_id: int) -> bool:
    cur.execute(
        f"SELECT 1 FROM {SCHEMA}.admin_shifts WHERE staff_id = %s AND shift_date = %s "
        "AND started_at IS NOT NULL AND finished_at IS NULL",
        (staff_id, datetime.now(MSK).date()),
    )
    return cur.fetchone() is not None


def list_tasks(cur, me):
    on_shift = me['role'] == 'admin' or _is_on_shift(cur, me['id'])
    cur.execute(
        f"SELECT {FIELDS} {FROM} WHERE (t.assignee_id = %s AND NOT t.for_shift) OR (t.for_shift AND %s) {ORDER}",
        (me['id'], on_shift),
    )
    mine = _with_comments(cur, _with_msk(cur.fetchall()))
    cur.execute(
        f"SELECT {FIELDS} {FROM} WHERE t.author_id = %s AND (t.assignee_id <> %s OR t.for_shift) {ORDER}",
        (me['id'], me['id']),
    )
    given = _with_comments(cur, _with_msk(cur.fetchall()))
    assignees = _assignees(cur, me)
    return _json({'ok': True, 'mine': mine, 'given': given, 'assignees': assignees, 'can_assign': bool(assignees), 'on_shift': on_shift})


def shift_tasks(cur, me):
    """Все задачи «Админ на смене» — для дашборда руководителей и админов."""
    if me['role'] not in SHIFT_ROLES:
        return _json({'ok': False, 'message': 'Нет доступа'}, 403)
    cur.execute(
        f"SELECT {FIELDS} {FROM} WHERE t.for_shift AND (t.status = 'open' OR t.done_at > now() - interval '1 day') {ORDER}"
    )
    return _json({'ok': True, 'tasks': _with_comments(cur, _with_msk(cur.fetchall()))})


def _assignees(cur, me):
    """Руководитель и админ ставят задачи себе, руководителям и администраторам; педагог сообщает им о проблемах."""
    if me['role'] not in ('head', 'admin', 'teacher'):
        return []
    roles = ('admin', 'head')
    cur.execute(
        f"SELECT id, full_name, role, job_title FROM {SCHEMA}.staff "
        "WHERE status = 'active' AND role IN %s AND full_name NOT LIKE '%%тест%%' AND full_name NOT LIKE '%%Тест%%' "
        "AND coalesce(job_title, '') NOT LIKE '%%тест%%' "
        "ORDER BY (id = %s) DESC, role DESC, full_name",
        (roles, me['id']),
    )
    people = []
    for r in cur.fetchall():
        fi = ' '.join((r['full_name'] or '').split()[:2])
        title = r['job_title'] or ('Администратор' if r['role'] == 'admin' else 'Руководитель')
        people.append({**r, 'label': f"{fi} ({title})"})
    heads = [p for p in people if p['role'] == 'head']
    admins = [p for p in people if p['role'] != 'head']
    shift = {'id': SHIFT_ID, 'full_name': 'Админ на смене', 'role': 'shift', 'job_title': None, 'label': 'Админ на смене'}
    if me['role'] == 'teacher':
        return heads + [shift]
    return heads + [shift] + admins


def create_task(cur, conn, me, data):
    title = (data.get('title') or '').strip()[:500]
    ids = data.get('assignee_ids') or ([data['assignee_id']] if data.get('assignee_id') else [])
    if not title or not ids:
        return _json({'ok': False, 'message': 'Укажите задачу и исполнителя'}, 400)
    ids = [int(i) for i in ids]
    problem = me['role'] == 'teacher'
    reporter = (data.get('reporter_name') or '').strip()[:200]
    if problem and not reporter:
        return _json({'ok': False, 'message': 'Укажите фамилию и имя педагога'}, 400)
    allowed = {a['id'] for a in _assignees(cur, me)}
    if any(i not in allowed for i in ids):
        return _json({'ok': False, 'message': 'Этому сотруднику нельзя поставить задачу'}, 403)
    desc = (data.get('description') or '').strip()
    due = (data.get('due_date') or '').strip() or None
    urgency = _urgency(data.get('urgency'))
    files = json.dumps(_clean_attachments(data.get('attachments')), ensure_ascii=False)
    for aid in ids:
        shift = aid == SHIFT_ID
        cur.execute(
            f"INSERT INTO {SCHEMA}.staff_tasks (title, description, author_id, assignee_id, due_date, urgency, attachments, for_shift, notified_at, is_problem, reporter_name) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s)",
            (title, desc, me['id'], me['id'] if shift else aid, due, urgency, files, shift, 'now' if shift else None, problem, reporter if problem else ''),
        )
    conn.commit()
    return _json({'ok': True})


def update_task(cur, conn, me, data):
    t = _task(cur, int(data.get('id') or 0))
    if not t or t['author_id'] != me['id']:
        return _json({'ok': False, 'message': 'Задача не найдена'}, 404)
    title = (data.get('title') or t['title']).strip()[:500]
    desc = data.get('description', t['description']) or ''
    due = data.get('due_date', t['due_date']) or None
    aid = t['assignee_id'] if t['for_shift'] else int(data.get('assignee_id') or t['assignee_id'])
    urgency = _urgency(data.get('urgency') or t['urgency'])
    old_due = t['due_date'].isoformat() if t['due_date'] else None
    new_due = due.isoformat() if hasattr(due, 'isoformat') else (str(due)[:10] if due else None)
    changed = title != t['title'] or desc.strip() != (t['description'] or '') or new_due != old_due
    original = t['original']
    if changed and not original:
        original = {'title': t['title'], 'description': t['description'] or '', 'due_date': old_due, 'urgency': t['urgency']}
    cur.execute(
        f"UPDATE {SCHEMA}.staff_tasks SET title=%s, description=%s, due_date=%s, assignee_id=%s, urgency=%s, "
        "original=%s::jsonb, edited_at=CASE WHEN %s THEN now() ELSE edited_at END WHERE id=%s",
        (title, desc.strip(), due, aid, urgency, json.dumps(original, ensure_ascii=False) if original else None, changed, t['id']),
    )
    conn.commit()
    return _json({'ok': True})


def set_status(cur, conn, me, data):
    t = _task(cur, int(data.get('id') or 0))
    allowed = t and (me['id'] in (t['author_id'], t['assignee_id']) or (t['for_shift'] and me['role'] in SHIFT_ROLES))
    if not allowed:
        return _json({'ok': False, 'message': 'Задача не найдена'}, 404)
    done = bool(data.get('done'))
    comment = (data.get('comment') or '').strip()
    cur.execute(
        f"UPDATE {SCHEMA}.staff_tasks SET status=%s, done_at=%s, done_comment=%s, done_by=%s, done_notified_at=NULL WHERE id=%s",
        ('done' if done else 'open', 'now' if done else None, comment if done else '', me['id'] if done else None, t['id']),
    )
    conn.commit()
    return _json({'ok': True})


def delete_task(cur, conn, me, data):
    t = _task(cur, int(data.get('id') or 0))
    if not t or t['author_id'] != me['id']:
        return _json({'ok': False, 'message': 'Задача не найдена'}, 404)
    cur.execute(f"DELETE FROM {SCHEMA}.staff_task_comments WHERE task_id = %s", (t['id'],))
    cur.execute(f"DELETE FROM {SCHEMA}.staff_task_shift_notices WHERE task_id = %s", (t['id'],))
    cur.execute(f"DELETE FROM {SCHEMA}.staff_tasks WHERE id = %s", (t['id'],))
    conn.commit()
    return _json({'ok': True})


def add_comment(cur, conn, me, data):
    """Комментарий к задаче: пишут автор и исполнитель, уведомление уходит второй стороне."""
    t = _task(cur, int(data.get('id') or 0))
    allowed = t and (me['id'] in (t['author_id'], t['assignee_id']) or (t['for_shift'] and me['role'] in SHIFT_ROLES))
    if not allowed:
        return _json({'ok': False, 'message': 'Задача не найдена'}, 404)
    text = (data.get('text') or '').strip()[:3000]
    if not text:
        return _json({'ok': False, 'message': 'Напишите комментарий'}, 400)
    if me['id'] != t['author_id']:
        recipient = t['author_id']
    elif t['for_shift'] or t['assignee_id'] == me['id']:
        recipient = None
    else:
        recipient = t['assignee_id']
    cur.execute(
        f"INSERT INTO {SCHEMA}.staff_task_comments (task_id, author_id, recipient_id, text) VALUES (%s, %s, %s, %s)",
        (t['id'], me['id'], recipient, text),
    )
    conn.commit()
    return _json({'ok': True})


def _comment_messages(cur):
    """Неотправленные уведомления о новых комментариях."""
    cur.execute(
        f"SELECT c.id, c.task_id, c.text, c.recipient_id, t.title, t.is_problem, w.full_name AS writer_name, "
        f"r.full_name AS recipient_name, r.phone AS recipient_phone, r.role AS recipient_role, c.created_at "
        f"FROM {SCHEMA}.staff_task_comments c JOIN {SCHEMA}.staff_tasks t ON t.id = c.task_id "
        f"JOIN {SCHEMA}.staff w ON w.id = c.author_id JOIN {SCHEMA}.staff r ON r.id = c.recipient_id "
        "WHERE c.notified_at IS NULL AND r.status = 'active' ORDER BY c.created_at"
    )
    out = []
    for c in cur.fetchall():
        who = ' '.join((c['writer_name'] or '').split()[:2])
        link = f"{SITE}/admin/teacher" if c['recipient_role'] == 'teacher' else _tasks_link(c['recipient_role'])
        lines = [f"💬 Новый комментарий к {'обращению' if c['is_problem'] else 'задаче'}:", f"-{c['title']}", f"{who}: {c['text']}", '', f"Подробнее: {link}"]
        out.append({
            'task_id': c['task_id'],
            'message_key': f"task-{c['task_id']}-comment-{c['id']}",
            'kind': 'comment',
            'is_problem': bool(c['is_problem']),
            'staff_id': c['recipient_id'],
            'full_name': c['recipient_name'],
            'phone': ''.join(ch for ch in (c['recipient_phone'] or '') if ch.isdigit()),
            'author_name': c['writer_name'],
            'created_msk': _msk(c['created_at']),
            'text': '\n'.join(lines),
        })
    return out


CDN_PREFIX = 'https://cdn.poehali.dev/projects/'
MAX_FILE = 10 * 1024 * 1024


def _clean_attachments(items) -> list:
    out = []
    for f in (items or [])[:10]:
        url = str((f or {}).get('url') or '')
        if not url.startswith(CDN_PREFIX):
            continue
        out.append({
            'url': url,
            'name': str(f.get('name') or 'файл')[:200],
            'type': str(f.get('type') or '')[:100],
            'size': int(f.get('size') or 0),
        })
    return out


def upload_file(me, data):
    raw = str(data.get('data') or '')
    if ',' in raw and raw.startswith('data:'):
        raw = raw.split(',', 1)[1]
    body = base64.b64decode(raw)
    if not body or len(body) > MAX_FILE:
        return _json({'ok': False, 'message': 'Файл пустой или больше 10 МБ'}, 400)
    name = str(data.get('name') or 'file')[:200]
    ctype = str(data.get('type') or 'application/octet-stream')[:100]
    ext = os.path.splitext(name)[1].lower()[:10]
    key = f"staff-tasks/{me['id']}/{uuid.uuid4().hex}{ext}"
    s3 = boto3.client(
        's3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=body, ContentType=ctype)
    url = f"{CDN_PREFIX}{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return _json({'ok': True, 'file': {'url': url, 'name': name, 'type': ctype, 'size': len(body)}})


def _service_key_ok(event) -> bool:
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    if not key:
        return False
    for name, value in (event.get('headers') or {}).items():
        if str(name).lower() == 'x-service-key':
            return str(value or '') == key
    return False


URGENCY_LABELS = {'urgent': '🔴 Срочно (в течение дня)', 'medium': '🟡 Средне (в течение 3 дней)', 'low': '🟢 Не срочно (когда будет время)'}


def digest(cur):
    """Ежедневная сводка для «Окна взаимодействия»: открытые задачи каждого сотрудника одним сообщением."""
    cur.execute(
        f"SELECT {FIELDS}, s.phone AS assignee_phone {FROM} "
        "WHERE t.status = 'open' AND s.status = 'active' AND NOT t.for_shift "
        "ORDER BY t.assignee_id, CASE t.urgency WHEN 'urgent' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, "
        "t.due_date NULLS LAST, t.created_at"
    )
    people: Dict[int, Dict[str, Any]] = {}
    for r in _with_msk(cur.fetchall()):
        p = people.setdefault(r['assignee_id'], {
            'staff_id': r['assignee_id'],
            'full_name': r['assignee_name'],
            'phone': ''.join(ch for ch in (r['assignee_phone'] or '') if ch.isdigit()),
            'tasks': [],
        })
        p['tasks'].append({
            'id': r['id'], 'title': r['title'], 'description': r['description'],
            'urgency': r['urgency'], 'due_date': r['due_date'], 'author_name': r['author_name'],
            'created_msk': r['created_msk'],
            'attachments': r['attachments'] or [],
            'is_problem': r['is_problem'], 'reporter_name': r['reporter_name'],
        })
    today = date.today().isoformat()
    for p in people.values():
        lines = [f"Добрый день! Ваши открытые задачи ({len(p['tasks'])}):", '']
        for i, t in enumerate(p['tasks'], 1):
            due = ''
            if t['due_date']:
                d = t['due_date'].isoformat() if hasattr(t['due_date'], 'isoformat') else str(t['due_date'])
                due = f" · до {d[8:10]}.{d[5:7]}" + (' — просрочено!' if d < today else '')
            prefix = f"⚠️ Проблема от {t['reporter_name']}: " if t['is_problem'] else ''
            lines.append(f"{i}. {URGENCY_LABELS.get(t['urgency'], '')} · {prefix}{t['title']}{due}")
            if t['description']:
                lines.append(f"   {t['description']}")
            for f in t['attachments']:
                lines.append(f"   📎 {f['name']}: {f['url']}")
            lines.append(f"   от: {t['author_name']}, поставлена {t['created_msk']}")
        lines += ['', 'Когда выполните — отметьте «Выполнено» в кабинете, и задача перестанет приходить.']
        p['text'] = '\n'.join(lines)
    return _json({'ok': True, 'date': today, 'recipients': list(people.values())})


SITE = 'https://lineaschool.ru'
SHORT_URGENCY = {'urgent': 'срочно!', 'medium': 'средне срочно', 'low': 'не срочно'}
URGENCY_EMOJI = {'urgent': '🔴', 'medium': '🟡', 'low': '🟢'}
URG_ORDER = "CASE t.urgency WHEN 'urgent' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END"


def _tasks_link(role: str) -> str:
    page = 'head-workspace' if role == 'head' else 'admin-workspace'
    return f"{SITE}/admin/{page}?section=tasks"


def new_tasks(cur):
    """Новые задачи, о которых исполнитель ещё не уведомлён: готовый текст сообщения на каждую."""
    messages = _pending_messages(cur)
    print(f"new-tasks: отдано сообщений {len(messages)}: {[m['message_key'] for m in messages]}")
    return _json({'ok': True, 'messages': messages})


def _pending_messages(cur):
    cur.execute(
        f"SELECT {FIELDS}, s.phone AS assignee_phone, s.role AS assignee_role {FROM} "
        "WHERE t.status = 'open' AND t.notified_at IS NULL AND s.status = 'active' AND NOT t.for_shift ORDER BY t.created_at"
    )
    fresh = _with_msk(cur.fetchall())
    messages = []
    for t in fresh:
        cur.execute(
            f"SELECT t.title, t.urgency, t.is_problem, t.reporter_name FROM {SCHEMA}.staff_tasks t "
            f"WHERE t.assignee_id = %s AND t.status = 'open' AND NOT t.for_shift AND t.id <> %s ORDER BY {URG_ORDER}, t.created_at",
            (t['assignee_id'], t['id']),
        )
        others = cur.fetchall()
        kind = 'Новая проблема от педагога' if t['is_problem'] else 'Новая задача'
        lines = [f"{URGENCY_EMOJI.get(t['urgency'], '🟡')} {kind} - {SHORT_URGENCY.get(t['urgency'], 'средне срочно')}:", f"-{t['title']}"]
        if t['is_problem']:
            lines.append(f"Сообщил(а): {t['reporter_name']}")
        if t['description']:
            lines.append(t['description'])
        for f in t['attachments'] or []:
            lines.append(f"📎 {f['name']}: {f['url']}")
        if others:
            lines += ['', 'Другие ваши задачи:']
            lines += [_task_line(o) for o in others]
        lines += ['', f"Подробнее: {_tasks_link(t['assignee_role'])}"]
        messages.append({
            'task_id': t['id'],
            'message_key': f"task-{t['id']}-new",
            'kind': 'new',
            'is_problem': bool(t['is_problem']),
            'staff_id': t['assignee_id'],
            'full_name': t['assignee_name'],
            'phone': ''.join(ch for ch in (t['assignee_phone'] or '') if ch.isdigit()),
            'author_name': t['author_name'],
            'created_msk': t['created_msk'],
            'text': '\n'.join(lines),
        })
    messages += _shift_task_messages(cur)
    messages += _solved_problems(cur)
    messages += _comment_messages(cur)
    return messages


def _shift_task_messages(cur):
    """Задачи «Админ на смене»: каждому, кто сейчас на смене, — по одному сообщению на задачу.
    Кто заступит позже, получит открытые задачи при старте смены."""
    cur.execute(
        f"SELECT {FIELDS}, sh.staff_id AS shift_staff_id, w.full_name AS shift_name, w.phone AS shift_phone, w.role AS shift_role "
        f"{FROM} JOIN {SCHEMA}.admin_shifts sh ON sh.shift_date = %s AND sh.started_at IS NOT NULL AND sh.finished_at IS NULL "
        f"JOIN {SCHEMA}.staff w ON w.id = sh.staff_id AND w.status = 'active' AND w.role IN %s "
        f"WHERE t.for_shift AND t.status = 'open' AND sh.staff_id <> t.author_id AND NOT EXISTS ("
        f"SELECT 1 FROM {SCHEMA}.staff_task_shift_notices n WHERE n.task_id = t.id AND n.staff_id = sh.staff_id) "
        "ORDER BY t.created_at",
        (datetime.now(MSK).date(), SHIFT_ROLES),
    )
    out = []
    for t in _with_msk(cur.fetchall()):
        kind = 'Новая проблема от педагога' if t['is_problem'] else 'Новая задача для админа на смене'
        lines = [f"{URGENCY_EMOJI.get(t['urgency'], '🟡')} {kind} - {SHORT_URGENCY.get(t['urgency'], 'средне срочно')}:", f"-{t['title']}"]
        if t['is_problem']:
            lines.append(f"Сообщил(а): {t['reporter_name']}")
        if t['description']:
            lines.append(t['description'])
        for f in t['attachments'] or []:
            lines.append(f"📎 {f['name']}: {f['url']}")
        lines += [f"от: {t['author_name']}, поставлена {t['created_msk']}", '', f"Подробнее: {_tasks_link(t['shift_role'])}"]
        out.append({
            'task_id': t['id'],
            'message_key': f"task-{t['id']}-shift-{t['shift_staff_id']}",
            'kind': 'shift',
            'is_problem': bool(t['is_problem']),
            'staff_id': t['shift_staff_id'],
            'full_name': t['shift_name'],
            'phone': ''.join(ch for ch in (t['shift_phone'] or '') if ch.isdigit()),
            'author_name': t['author_name'],
            'created_msk': t['created_msk'],
            'text': '\n'.join(lines),
        })
    return out


WINDOW_NOTIFY_URL = 'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1?action=staff-notify'


def _notify_kind(m) -> str:
    if m.get('kind') == 'done':
        return 'done'
    if m.get('is_problem'):
        return 'problem'
    return 'new'


def _send_via_window(messages) -> set:
    """Передать уведомления «Окну взаимодействия» одним запросом; вернуть message_key успешно отправленных."""
    key = os.environ.get('INTERACTION_SERVICE_KEY')
    batch = [m for m in messages if m.get('phone')]
    if not key or not batch:
        return set()
    payload = {'messages': [{
        'staff_name': m.get('full_name') or '',
        'phone': m['phone'],
        'text': m['text'],
        'message_key': m['message_key'],
        'task_id': m.get('task_id'),
        'kind': _notify_kind(m),
    } for m in batch]}
    req = urllib.request.Request(WINDOW_NOTIFY_URL, data=json.dumps(payload, ensure_ascii=False).encode('utf-8'), method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('X-Service-Key', key)
    try:
        with urllib.request.urlopen(req, timeout=3.5) as r:
            res = json.loads(r.read().decode('utf-8') or '{}')
    except urllib.error.HTTPError as e:
        print(f"staff-notify HTTP {e.code}: {e.read().decode('utf-8', 'ignore')[:300]}")
        return set()
    except Exception as e:
        print(f"staff-notify FAILED: {e}")
        return set()
    ok = {str(x.get('message_key')) for x in (res.get('results') or []) if x.get('ok')}
    print(f"staff-notify: отправлено {len(ok)} из {len(batch)}: {sorted(ok)}")
    return ok


def push_pending(cur, conn):
    """Передать «Окну взаимодействия» все неотправленные уведомления о задачах — оно доставит их сотрудникам."""
    shift_msgs = _shift_reminder_messages(cur)
    for m in shift_msgs:
        m['message_key'] = f"shift-{m['shift_id']}"
    task_msgs = _pending_messages(cur)
    ok = _send_via_window(shift_msgs + task_msgs)
    if not ok:
        return []
    reminded = [m['shift_id'] for m in shift_msgs if m['message_key'] in ok]
    if reminded:
        mark_shift_reminded(cur, conn, {'shift_ids': reminded})
    keys = [m['message_key'] for m in task_msgs if m['message_key'] in ok]
    if keys:
        mark_notified(cur, conn, {'message_keys': keys})
    return sorted(ok)


def _solved_problems(cur):
    """Автору: его задачу выполнили или проблему решили (если закрыл не он сам)."""
    cur.execute(
        f"SELECT t.id, t.title, t.done_comment, t.author_id, t.is_problem, a.full_name AS author_name, "
        f"a.phone AS author_phone, a.role AS author_role, "
        f"d.full_name AS done_by_name, to_char(t.done_at + interval '3 hours', 'DD.MM.YYYY HH24:MI') AS done_msk, "
        f"to_char(t.done_at, 'YYYYMMDDHH24MISS') AS done_stamp "
        f"FROM {SCHEMA}.staff_tasks t JOIN {SCHEMA}.staff a ON a.id = t.author_id "
        f"LEFT JOIN {SCHEMA}.staff d ON d.id = t.done_by "
        "WHERE t.status = 'done' AND t.done_notified_at IS NULL AND a.status = 'active' AND a.phone ~ '[0-9]' "
        "AND t.done_by IS DISTINCT FROM t.author_id "
        "ORDER BY t.done_at"
    )
    out = []
    for t in cur.fetchall():
        who = ' '.join((t['done_by_name'] or '').split()[:2])
        problem = t['is_problem']
        lines = ['✅ Ваша проблема решена:' if problem else '✅ Ваша задача выполнена:', f"-{t['title']}"]
        if who:
            lines.append(f"{'Решил(а)' if problem else 'Выполнил(а)'}: {who}")
        if t['done_comment']:
            lines.append(f"Комментарий: {t['done_comment']}")
        link = f"{SITE}/admin/teacher" if t['author_role'] == 'teacher' else _tasks_link(t['author_role'])
        lines += ['', f"Подробнее: {link}"]
        out.append({
            'task_id': t['id'],
            'message_key': f"task-{t['id']}-done-{t['done_stamp']}",
            'kind': 'done',
            'staff_id': t['author_id'],
            'full_name': t['author_name'],
            'phone': ''.join(ch for ch in (t['author_phone'] or '') if ch.isdigit()),
            'author_name': t['done_by_name'] or '',
            'created_msk': t['done_msk'],
            'text': '\n'.join(lines),
        })
    return out


def _task_line(t) -> str:
    prefix = f"⚠️ Проблема от {t['reporter_name']}: " if t.get('is_problem') else ''
    return f"{URGENCY_EMOJI.get(t['urgency'], '🟡')} {prefix}{t['title']} ({SHORT_URGENCY.get(t['urgency'], 'средне срочно')})"


def shift_reminders(cur):
    """Напоминания админам, заступившим на смену: личные задачи + общие задачи для админа на смене."""
    return _json({'ok': True, 'messages': _shift_reminder_messages(cur)})


def _shift_reminder_messages(cur):
    today = datetime.now(MSK).date()
    cur.execute(
        f"SELECT sh.id AS shift_id, s.id AS staff_id, s.full_name, s.phone, s.role FROM {SCHEMA}.admin_shifts sh "
        f"JOIN {SCHEMA}.staff s ON s.id = sh.staff_id "
        "WHERE sh.shift_date = %s AND sh.started_at IS NOT NULL AND sh.finished_at IS NULL "
        "AND sh.tasks_reminded_at IS NULL AND s.status = 'active' AND s.role IN %s",
        (today, SHIFT_ROLES),
    )
    shifts = cur.fetchall()
    if not shifts:
        return []
    cur.execute(
        f"SELECT t.title, t.urgency, t.description, t.is_problem, t.reporter_name FROM {SCHEMA}.staff_tasks t "
        f"WHERE t.for_shift AND t.status = 'open' ORDER BY {URG_ORDER}, t.created_at"
    )
    common = cur.fetchall()
    messages = []
    for sh in shifts:
        cur.execute(
            f"SELECT t.title, t.urgency, t.is_problem, t.reporter_name FROM {SCHEMA}.staff_tasks t "
            f"WHERE t.assignee_id = %s AND t.status = 'open' AND NOT t.for_shift ORDER BY {URG_ORDER}, t.created_at",
            (sh['staff_id'],),
        )
        personal = cur.fetchall()
        if not personal and not common:
            continue
        lines = ['Вы заступили на смену. Напоминаем о задачах:']
        if personal:
            lines += ['', 'Ваши задачи:'] + [_task_line(t) for t in personal]
        if common:
            lines += ['', 'Задачи для админа на смене:'] + [_task_line(t) for t in common]
        lines += ['', f"Подробнее: {_tasks_link(sh['role'])}"]
        messages.append({
            'shift_id': sh['shift_id'],
            'staff_id': sh['staff_id'],
            'full_name': sh['full_name'],
            'phone': ''.join(ch for ch in (sh['phone'] or '') if ch.isdigit()),
            'text': '\n'.join(lines),
        })
    return messages


def mark_shift_reminded(cur, conn, data):
    ids = [int(i) for i in (data.get('shift_ids') or []) if str(i).isdigit()]
    if ids:
        cur.execute(f"UPDATE {SCHEMA}.admin_shifts SET tasks_reminded_at = now() WHERE id IN %s", (tuple(ids),))
        # В напоминании уже перечислены все открытые задачи смены — отдельно их не дублируем
        cur.execute(
            f"INSERT INTO {SCHEMA}.staff_task_shift_notices (task_id, staff_id) "
            f"SELECT t.id, sh.staff_id FROM {SCHEMA}.staff_tasks t CROSS JOIN {SCHEMA}.admin_shifts sh "
            "WHERE sh.id IN %s AND t.for_shift AND t.status = 'open' ON CONFLICT DO NOTHING",
            (tuple(ids),),
        )
        conn.commit()
    return _json({'ok': True, 'marked': len(ids)})


def mark_notified(cur, conn, data):
    """Отметить отправленные сообщения. Лучше по message_keys; task_ids — для совместимости."""
    new_ids, done_ids, comment_ids, shift_pairs = set(), set(), set(), set()
    for k in data.get('message_keys') or []:
        parts = str(k).split('-')
        if len(parts) >= 4 and parts[0] == 'task' and parts[2] == 'shift' and parts[1].isdigit() and parts[3].isdigit():
            shift_pairs.add((int(parts[1]), int(parts[3])))
        elif len(parts) >= 4 and parts[0] == 'task' and parts[2] == 'comment' and parts[3].isdigit():
            comment_ids.add(int(parts[3]))
        elif len(parts) >= 3 and parts[0] == 'task' and parts[1].isdigit():
            (new_ids if parts[2] == 'new' else done_ids).add(int(parts[1]))
    for task_id, staff_id in shift_pairs:
        cur.execute(
            f"INSERT INTO {SCHEMA}.staff_task_shift_notices (task_id, staff_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (task_id, staff_id),
        )
    if comment_ids:
        cur.execute(f"UPDATE {SCHEMA}.staff_task_comments SET notified_at = now() WHERE id IN %s AND notified_at IS NULL", (tuple(comment_ids),))
    ids = [int(i) for i in (data.get('task_ids') or []) if str(i).isdigit()]
    if ids:
        new_ids.update(ids)
        done_ids.update(ids)
    if new_ids:
        cur.execute(f"UPDATE {SCHEMA}.staff_tasks SET notified_at = now() WHERE id IN %s AND notified_at IS NULL AND status = 'open'", (tuple(new_ids),))
    if done_ids:
        cur.execute(
            f"UPDATE {SCHEMA}.staff_tasks SET done_notified_at = now() "
            "WHERE id IN %s AND status = 'done' AND done_notified_at IS NULL",
            (tuple(done_ids),),
        )
    conn.commit()
    print(f"mark-notified: new={sorted(new_ids)} done={sorted(done_ids)} comments={sorted(comment_ids)} shift={sorted(shift_pairs)}")
    return _json({'ok': True, 'marked': len(new_ids) + len(done_ids) + len(comment_ids) + len(shift_pairs)})


def handler(event: dict, context) -> dict:
    """Задачи сотрудникам: руководитель ставит задачи РУО и администраторам, исполнители видят свои задачи и отмечают выполненные.
    GET — мои задачи (+ поставленные мной и список исполнителей для руководителя); POST action=create|update|status|comment|delete."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=5)
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        svc = (event.get('queryStringParameters') or {}).get('action')
        if svc:
            print(f"service call: {svc}")
        if svc in ('digest', 'new-tasks', 'mark-notified', 'shift-reminders', 'mark-shift-reminded', 'push'):
            if not _service_key_ok(event):
                return _json({'ok': False, 'message': 'Неверный служебный ключ'}, 403)
            if svc == 'digest':
                return digest(cur)
            if svc == 'new-tasks':
                return new_tasks(cur)
            if svc == 'push':
                return _json({'ok': True, 'sent': push_pending(cur, conn)})
            if svc == 'shift-reminders':
                return shift_reminders(cur)
            if svc == 'mark-shift-reminded':
                return mark_shift_reminded(cur, conn, json.loads(event.get('body') or '{}'))
            return mark_notified(cur, conn, json.loads(event.get('body') or '{}'))
        me = _me(cur, event)
        data = json.loads(event.get('body') or '{}') if event.get('httpMethod') == 'POST' else {}
        action = data.get('action')
        problem_mode = (event.get('queryStringParameters') or {}).get('problem') == '1'
        # Сообщить о проблеме педагог может без входа: обращение идёт от общего аккаунта
        if problem_mode and (not me or me['role'] == 'teacher') and (event.get('httpMethod') == 'GET' or action in ('create', 'upload')):
            cur.execute(
                f"SELECT id, full_name, role FROM {SCHEMA}.staff WHERE phone = 'shared-teacher' AND status = 'system'"
            )
            me = me or cur.fetchone()
        if not me:
            return _json({'ok': False, 'message': 'Нужно войти'}, 401)
        if event.get('httpMethod') == 'GET':
            if (event.get('queryStringParameters') or {}).get('shift') == '1':
                push_pending(cur, conn)
                return shift_tasks(cur, me)
            return list_tasks(cur, me)
        if action == 'upload':
            return upload_file(me, data)
        if action == 'create':
            res = create_task(cur, conn, me, data)
            if res['statusCode'] == 200:
                push_pending(cur, conn)
            return res
        if action == 'update':
            res = update_task(cur, conn, me, data)
            if res['statusCode'] == 200:
                push_pending(cur, conn)
            return res
        if action == 'status':
            res = set_status(cur, conn, me, data)
            if res['statusCode'] == 200:
                push_pending(cur, conn)
            return res
        if action == 'comment':
            res = add_comment(cur, conn, me, data)
            if res['statusCode'] == 200:
                push_pending(cur, conn)
            return res
        if action == 'delete':
            return delete_task(cur, conn, me, data)
        return _json({'ok': False, 'message': 'Неизвестное действие'}, 400)
    finally:
        conn.close()