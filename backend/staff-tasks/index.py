import os
import json
import base64
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Optional

import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p93118852_lineaschool_initiati'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Service-Key',
    'Access-Control-Max-Age': '86400',
}

FIELDS = (
    "t.id, t.title, t.description, t.author_id, a.full_name AS author_name, t.assignee_id, "
    "CASE WHEN t.for_shift THEN 'Админ на смене' ELSE s.full_name END AS assignee_name, t.for_shift, "
    "d.full_name AS done_by_name, t.due_date, t.urgency, t.status, t.done_at, t.done_comment, t.created_at, t.attachments, t.is_problem, t.reporter_name"
)
FROM = (
    f"FROM {SCHEMA}.staff_tasks t JOIN {SCHEMA}.staff a ON a.id = t.author_id "
    f"JOIN {SCHEMA}.staff s ON s.id = t.assignee_id LEFT JOIN {SCHEMA}.staff d ON d.id = t.done_by"
)
SHIFT_ID = 0
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
    mine = _with_msk(cur.fetchall())
    cur.execute(
        f"SELECT {FIELDS} {FROM} WHERE t.author_id = %s AND (t.assignee_id <> %s OR t.for_shift) {ORDER}",
        (me['id'], me['id']),
    )
    given = _with_msk(cur.fetchall())
    assignees = _assignees(cur, me)
    return _json({'ok': True, 'mine': mine, 'given': given, 'assignees': assignees, 'can_assign': bool(assignees), 'on_shift': on_shift})


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
    cur.execute(
        f"UPDATE {SCHEMA}.staff_tasks SET title=%s, description=%s, due_date=%s, assignee_id=%s, urgency=%s WHERE id=%s",
        (title, desc.strip(), due, aid, urgency, t['id']),
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
    cur.execute(f"DELETE FROM {SCHEMA}.staff_tasks WHERE id = %s", (t['id'],))
    conn.commit()
    return _json({'ok': True})


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
            'staff_id': t['assignee_id'],
            'full_name': t['assignee_name'],
            'phone': ''.join(ch for ch in (t['assignee_phone'] or '') if ch.isdigit()),
            'author_name': t['author_name'],
            'created_msk': t['created_msk'],
            'text': '\n'.join(lines),
        })
    messages += _solved_problems(cur)
    return _json({'ok': True, 'messages': messages})


def _solved_problems(cur):
    """Автору: его задачу выполнили или проблему решили (если закрыл не он сам)."""
    cur.execute(
        f"SELECT t.id, t.title, t.done_comment, t.author_id, t.is_problem, a.full_name AS author_name, "
        f"a.phone AS author_phone, a.role AS author_role, "
        f"d.full_name AS done_by_name, to_char(t.done_at + interval '3 hours', 'DD.MM.YYYY HH24:MI') AS done_msk, "
        f"to_char(t.done_at, 'YYYYMMDDHH24MISS') AS done_stamp "
        f"FROM {SCHEMA}.staff_tasks t JOIN {SCHEMA}.staff a ON a.id = t.author_id "
        f"LEFT JOIN {SCHEMA}.staff d ON d.id = t.done_by "
        "WHERE t.status = 'done' AND t.done_notified_at IS NULL AND a.status = 'active' "
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
        return _json({'ok': True, 'messages': []})
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
    return _json({'ok': True, 'messages': messages})


def mark_shift_reminded(cur, conn, data):
    ids = [int(i) for i in (data.get('shift_ids') or []) if str(i).isdigit()]
    if ids:
        cur.execute(f"UPDATE {SCHEMA}.admin_shifts SET tasks_reminded_at = now() WHERE id IN %s", (tuple(ids),))
        conn.commit()
    return _json({'ok': True, 'marked': len(ids)})


def mark_notified(cur, conn, data):
    """Отметить отправленные сообщения. Лучше по message_keys; task_ids — для совместимости."""
    new_ids, done_ids = set(), set()
    for k in data.get('message_keys') or []:
        parts = str(k).split('-')
        if len(parts) >= 3 and parts[0] == 'task' and parts[1].isdigit():
            (new_ids if parts[2] == 'new' else done_ids).add(int(parts[1]))
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
    return _json({'ok': True, 'marked': len(new_ids) + len(done_ids)})


def handler(event: dict, context) -> dict:
    """Задачи сотрудникам: руководитель ставит задачи РУО и администраторам, исполнители видят свои задачи и отмечают выполненные.
    GET — мои задачи (+ поставленные мной и список исполнителей для руководителя); POST action=create|update|status|delete."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=5)
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        svc = (event.get('queryStringParameters') or {}).get('action')
        if svc in ('digest', 'new-tasks', 'mark-notified', 'shift-reminders', 'mark-shift-reminded'):
            if not _service_key_ok(event):
                return _json({'ok': False, 'message': 'Неверный служебный ключ'}, 403)
            if svc == 'digest':
                return digest(cur)
            if svc == 'new-tasks':
                return new_tasks(cur)
            if svc == 'shift-reminders':
                return shift_reminders(cur)
            if svc == 'mark-shift-reminded':
                return mark_shift_reminded(cur, conn, json.loads(event.get('body') or '{}'))
            return mark_notified(cur, conn, json.loads(event.get('body') or '{}'))
        me = _me(cur, event)
        if not me:
            return _json({'ok': False, 'message': 'Нужно войти'}, 401)
        if event.get('httpMethod') == 'GET':
            return list_tasks(cur, me)
        data = json.loads(event.get('body') or '{}')
        action = data.get('action')
        if action == 'upload':
            return upload_file(me, data)
        if action == 'create':
            return create_task(cur, conn, me, data)
        if action == 'update':
            return update_task(cur, conn, me, data)
        if action == 'status':
            return set_status(cur, conn, me, data)
        if action == 'delete':
            return delete_task(cur, conn, me, data)
        return _json({'ok': False, 'message': 'Неизвестное действие'}, 400)
    finally:
        conn.close()