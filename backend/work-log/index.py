import os
import json
from datetime import date, timedelta
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


def _json(payload: Dict[str, Any], code: int = 200) -> Dict[str, Any]:
    return {
        'statusCode': code,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(payload, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=5)


def _me(cur, event) -> Optional[Dict[str, Any]]:
    """Кто вызывает. Токен тот же, что и во всей админке."""
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    if not token:
        token = (event.get('queryStringParameters') or {}).get('token')
    if not token:
        return None
    cur.execute(
        "SELECT s.id, s.full_name, s.role FROM staff_sessions ss "
        "JOIN staff s ON s.id = ss.staff_id "
        "WHERE ss.token = %s AND ss.expires_at > now() AND s.status = 'active'",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {'id': row['id'], 'full_name': row['full_name'], 'role': row['role']}


def _body(event) -> Dict[str, Any]:
    try:
        return json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return {}


def _period_range(params: Dict[str, Any]):
    """Границы периода. По умолчанию — текущий месяц."""
    date_from = (params.get('date_from') or '').strip()
    date_to = (params.get('date_to') or '').strip()
    if date_from and date_to:
        return date_from, date_to
    today = date.today()
    start = today.replace(day=1)
    nxt = (start + timedelta(days=32)).replace(day=1)
    return start.isoformat(), (nxt - timedelta(days=1)).isoformat()


def add_entry(cur, me: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
    task_code = (data.get('task_code') or '').strip()
    task_title = (data.get('task_title') or '').strip()
    log_date = (data.get('log_date') or '').strip() or date.today().isoformat()
    category = (data.get('category') or 'other').strip()
    subject = (data.get('subject') or '').strip() or None
    comment = (data.get('comment') or '').strip() or None

    if not task_code or not task_title:
        return _json({'ok': False, 'message': 'Не выбрано действие'}, 400)

    try:
        minutes = int(data.get('minutes') or 0)
    except (TypeError, ValueError):
        minutes = 0
    # Время обязательно только руководителю: администратор отмечает
    # сам факт выполненной задачи, без затраченного времени.
    if me['role'] == 'head' and minutes <= 0:
        return _json({'ok': False, 'message': 'Укажите время на задачу'}, 400)
    if minutes < 0:
        minutes = 0

    cur.execute(
        f"INSERT INTO {SCHEMA}.work_log "
        f"(staff_id, staff_name, staff_role, log_date, task_code, task_title, "
        f" category, subject, comment, minutes) "
        f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (
            me['id'], me['full_name'], me['role'], log_date,
            task_code, task_title, category, subject, comment, minutes,
        ),
    )
    return _json({'ok': True, 'id': cur.fetchone()['id']})


def delete_entry(cur, me: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
    """Свою запись может убрать автор, чужую — только руководитель."""
    try:
        entry_id = int(data.get('id') or 0)
    except (TypeError, ValueError):
        entry_id = 0
    if not entry_id:
        return _json({'ok': False, 'message': 'Не указана запись'}, 400)

    if me['role'] == 'head':
        cur.execute(f"DELETE FROM {SCHEMA}.work_log WHERE id = %s", (entry_id,))
    else:
        cur.execute(
            f"DELETE FROM {SCHEMA}.work_log WHERE id = %s AND staff_id = %s",
            (entry_id, me['id']),
        )
    return _json({'ok': True, 'deleted': cur.rowcount})


def _all_scope(me: Dict[str, Any], params: Dict[str, Any]) -> bool:
    """Смотрим по всем сотрудникам или только свои записи.

    По умолчанию — только свои, даже у руководителя: раздел «Учёт рабочего
    времени» у всех личный. Сводка по школе открывается явным scope=all
    и доступна только руководителю.
    """
    return me['role'] == 'head' and (params.get('scope') or '').strip() == 'all'


def list_entries(cur, me: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
    """Список записей: свои либо по всем сотрудникам (только руководитель)."""
    date_from, date_to = _period_range(params)

    where = ['log_date >= %s', 'log_date <= %s']
    args: list = [date_from, date_to]

    if _all_scope(me, params):
        staff_id = (params.get('staff_id') or '').strip()
        if staff_id.isdigit():
            where.append('staff_id = %s')
            args.append(int(staff_id))
    else:
        where.append('staff_id = %s')
        args.append(me['id'])

    cur.execute(
        f"SELECT id, staff_id, staff_name, staff_role, log_date, task_code, task_title, "
        f"category, subject, comment, minutes, created_at "
        f"FROM {SCHEMA}.work_log WHERE " + ' AND '.join(where) +
        " ORDER BY log_date DESC, id DESC LIMIT 1000",
        args,
    )
    items = [dict(r) for r in cur.fetchall()]
    return _json({
        'ok': True,
        'items': items,
        'date_from': date_from,
        'date_to': date_to,
        'can_see_all': me['role'] == 'head',
        'scope_all': _all_scope(me, params),
    })


def stats(cur, me: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
    """Сводка за период: по сотрудникам, по типам задач и по дням."""
    date_from, date_to = _period_range(params)
    scope_all = _all_scope(me, params)

    where = ['log_date >= %s', 'log_date <= %s']
    args: list = [date_from, date_to]
    if not scope_all:
        where.append('staff_id = %s')
        args.append(me['id'])
    cond = ' AND '.join(where)

    cur.execute(
        f"SELECT staff_id, staff_name, staff_role, COUNT(*) AS tasks, "
        f"COALESCE(SUM(minutes), 0) AS minutes "
        f"FROM {SCHEMA}.work_log WHERE {cond} "
        f"GROUP BY staff_id, staff_name, staff_role ORDER BY tasks DESC",
        args,
    )
    by_staff = [dict(r) for r in cur.fetchall()]

    cur.execute(
        f"SELECT task_code, task_title, category, COUNT(*) AS tasks, "
        f"COALESCE(SUM(minutes), 0) AS minutes "
        f"FROM {SCHEMA}.work_log WHERE {cond} "
        f"GROUP BY task_code, task_title, category ORDER BY tasks DESC",
        args,
    )
    by_task = [dict(r) for r in cur.fetchall()]

    cur.execute(
        f"SELECT log_date, COUNT(*) AS tasks, COALESCE(SUM(minutes), 0) AS minutes "
        f"FROM {SCHEMA}.work_log WHERE {cond} "
        f"GROUP BY log_date ORDER BY log_date",
        args,
    )
    by_day = [dict(r) for r in cur.fetchall()]

    # Разрез по направлениям работы (категориям задач)
    cur.execute(
        f"SELECT category, COUNT(*) AS tasks, COALESCE(SUM(minutes), 0) AS minutes "
        f"FROM {SCHEMA}.work_log WHERE {cond} "
        f"GROUP BY category ORDER BY minutes DESC",
        args,
    )
    by_category = [dict(r) for r in cur.fetchall()]

    # Динамика по неделям — в целом и по направлениям.
    # Берём период шире, чтобы график недель был содержательным.
    wide_where = ["log_date >= (%s::date - INTERVAL '8 weeks')", 'log_date <= %s']
    wide_args: list = [date_to, date_to]
    if not scope_all:
        wide_where.append('staff_id = %s')
        wide_args.append(me['id'])
    wide_cond = ' AND '.join(wide_where)

    cur.execute(
        f"SELECT to_char(date_trunc('week', log_date), 'YYYY-MM-DD') AS week, "
        f"COUNT(*) AS tasks, COALESCE(SUM(minutes), 0) AS minutes "
        f"FROM {SCHEMA}.work_log WHERE {wide_cond} "
        f"GROUP BY 1 ORDER BY 1",
        wide_args,
    )
    by_week = [dict(r) for r in cur.fetchall()]

    cur.execute(
        f"SELECT to_char(date_trunc('week', log_date), 'YYYY-MM-DD') AS week, category, "
        f"COUNT(*) AS tasks, COALESCE(SUM(minutes), 0) AS minutes "
        f"FROM {SCHEMA}.work_log WHERE {wide_cond} "
        f"GROUP BY 1, 2 ORDER BY 1, 2",
        wide_args,
    )
    by_week_category = [dict(r) for r in cur.fetchall()]

    # Активные дни и объекты работы (по кому чаще всего задачи)
    cur.execute(
        f"SELECT COUNT(DISTINCT log_date) AS days FROM {SCHEMA}.work_log WHERE {cond}",
        args,
    )
    active_days = int((cur.fetchone() or {}).get('days') or 0)

    cur.execute(
        f"SELECT subject, COUNT(*) AS tasks, COALESCE(SUM(minutes), 0) AS minutes "
        f"FROM {SCHEMA}.work_log WHERE {cond} AND subject IS NOT NULL AND subject <> '' "
        f"GROUP BY subject ORDER BY tasks DESC LIMIT 10",
        args,
    )
    by_subject = [dict(r) for r in cur.fetchall()]

    # Тот же период месяцем ранее — для показа динамики
    cur.execute(
        f"SELECT COUNT(*) AS tasks, COALESCE(SUM(minutes), 0) AS minutes "
        f"FROM {SCHEMA}.work_log WHERE log_date >= (%s::date - INTERVAL '1 month') "
        f"AND log_date < %s::date" +
        ('' if scope_all else ' AND staff_id = %s'),
        [date_from, date_from] + ([] if scope_all else [me['id']]),
    )
    prev = dict(cur.fetchone() or {'tasks': 0, 'minutes': 0})

    total_tasks = sum(int(r['tasks']) for r in by_staff)
    total_minutes = sum(int(r['minutes']) for r in by_staff)

    return _json({
        'ok': True,
        'date_from': date_from,
        'date_to': date_to,
        'total_tasks': total_tasks,
        'total_minutes': total_minutes,
        'prev_tasks': int(prev.get('tasks') or 0),
        'prev_minutes': int(prev.get('minutes') or 0),
        'by_staff': by_staff,
        'by_task': by_task,
        'by_day': by_day,
        'by_category': by_category,
        'by_week': by_week,
        'by_week_category': by_week_category,
        'by_subject': by_subject,
        'active_days': active_days,
        'can_see_all': me['role'] == 'head',
        'scope_all': scope_all,
    })


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Учёт задач админов и руководителей: запись действий и сводка по ним."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': '', 'isBase64Encoded': False}

    conn = None
    try:
        conn = db()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json({'ok': False, 'message': 'Требуется вход'}, 401)
            if me['role'] not in ('admin', 'head'):
                return _json({'ok': False, 'message': 'Раздел только для админов и руководителей'}, 403)

            params = event.get('queryStringParameters') or {}
            action = (params.get('action') or '').strip()

            if method == 'GET':
                if action == 'stats':
                    result = stats(cur, me, params)
                else:
                    result = list_entries(cur, me, params)
                conn.commit()
                return result

            data = _body(event)
            act = (data.get('action') or '').strip()
            if act == 'delete':
                result = delete_entry(cur, me, data)
            else:
                result = add_entry(cur, me, data)
            conn.commit()
            return result
    except Exception as e:
        if conn:
            conn.rollback()
        return _json({'ok': False, 'message': f'Ошибка: {e}'}, 500)
    finally:
        if conn:
            conn.close()