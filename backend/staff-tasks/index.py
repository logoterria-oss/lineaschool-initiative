import os
import json
from typing import Any, Dict, Optional

import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p93118852_lineaschool_initiati'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

FIELDS = (
    "t.id, t.title, t.description, t.author_id, a.full_name AS author_name, t.assignee_id, "
    "s.full_name AS assignee_name, t.due_date, t.status, t.done_at, t.done_comment, t.created_at"
)
FROM = (
    f"FROM {SCHEMA}.staff_tasks t JOIN {SCHEMA}.staff a ON a.id = t.author_id "
    f"JOIN {SCHEMA}.staff s ON s.id = t.assignee_id"
)
ORDER = "ORDER BY (t.status = 'done'), t.due_date NULLS LAST, t.created_at DESC"


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


def _task(cur, task_id: int):
    cur.execute(f"SELECT {FIELDS} {FROM} WHERE t.id = %s", (task_id,))
    return cur.fetchone()


def list_tasks(cur, me):
    cur.execute(f"SELECT {FIELDS} {FROM} WHERE t.assignee_id = %s {ORDER}", (me['id'],))
    mine = cur.fetchall()
    cur.execute(f"SELECT {FIELDS} {FROM} WHERE t.author_id = %s AND t.assignee_id <> %s {ORDER}", (me['id'], me['id']))
    given = cur.fetchall()
    assignees = _assignees(cur, me)
    return _json({'ok': True, 'mine': mine, 'given': given, 'assignees': assignees, 'can_assign': bool(assignees)})


def _assignees(cur, me):
    """Руководитель ставит задачи себе, другим руководителям и администраторам."""
    if me['role'] != 'head':
        return []
    roles = ('admin', 'head')
    cur.execute(
        f"SELECT id, full_name, role, job_title FROM {SCHEMA}.staff "
        "WHERE status = 'active' AND role IN %s AND full_name NOT LIKE '%%тест%%' AND full_name NOT LIKE '%%Тест%%' "
        "AND coalesce(job_title, '') NOT LIKE '%%тест%%' "
        "ORDER BY (id = %s) DESC, role DESC, full_name",
        (roles, me['id']),
    )
    return cur.fetchall()


def create_task(cur, conn, me, data):
    title = (data.get('title') or '').strip()[:500]
    ids = data.get('assignee_ids') or ([data['assignee_id']] if data.get('assignee_id') else [])
    if not title or not ids:
        return _json({'ok': False, 'message': 'Укажите задачу и исполнителя'}, 400)
    allowed = {a['id'] for a in _assignees(cur, me)}
    if any(int(i) not in allowed for i in ids):
        return _json({'ok': False, 'message': 'Этому сотруднику нельзя поставить задачу'}, 403)
    desc = (data.get('description') or '').strip()
    due = (data.get('due_date') or '').strip() or None
    for aid in ids:
        cur.execute(
            f"INSERT INTO {SCHEMA}.staff_tasks (title, description, author_id, assignee_id, due_date) "
            "VALUES (%s, %s, %s, %s, %s)",
            (title, desc, me['id'], int(aid), due),
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
    aid = int(data.get('assignee_id') or t['assignee_id'])
    cur.execute(
        f"UPDATE {SCHEMA}.staff_tasks SET title=%s, description=%s, due_date=%s, assignee_id=%s WHERE id=%s",
        (title, desc.strip(), due, aid, t['id']),
    )
    conn.commit()
    return _json({'ok': True})


def set_status(cur, conn, me, data):
    t = _task(cur, int(data.get('id') or 0))
    if not t or me['id'] not in (t['author_id'], t['assignee_id']):
        return _json({'ok': False, 'message': 'Задача не найдена'}, 404)
    done = bool(data.get('done'))
    comment = (data.get('comment') or '').strip()
    cur.execute(
        f"UPDATE {SCHEMA}.staff_tasks SET status=%s, done_at=%s, done_comment=%s WHERE id=%s",
        ('done' if done else 'open', 'now' if done else None, comment if done else '', t['id']),
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


def handler(event: dict, context) -> dict:
    """Задачи сотрудникам: руководитель ставит задачи РУО и администраторам, исполнители видят свои задачи и отмечают выполненные.
    GET — мои задачи (+ поставленные мной и список исполнителей для руководителя); POST action=create|update|status|delete."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=5)
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        me = _me(cur, event)
        if not me:
            return _json({'ok': False, 'message': 'Нужно войти'}, 401)
        if event.get('httpMethod') == 'GET':
            return list_tasks(cur, me)
        data = json.loads(event.get('body') or '{}')
        action = data.get('action')
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