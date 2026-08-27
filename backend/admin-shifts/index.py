import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}

KINDS = ("work", "dayoff", "vacation", "sick")
SCHEMA = "t_p93118852_lineaschool_initiati"

# Школа работает по Москве, а сервер живёт в UTC.
# Все отметки смен и «сегодня» считаем в московском времени.
MSK_NOW = "(now() AT TIME ZONE 'Europe/Moscow')"
MSK_TODAY = f"({MSK_NOW})::date"


def db_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _json(status, payload):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False, default=str),
    }


def handler(event: dict, context) -> dict:
    """График работы администраторов по датам: список смен за месяц, сохранение и удаление смены"""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        if method == "GET":
            params = event.get("queryStringParameters") or {}
            act = str(params.get("action") or "")
            if act == "my-shift":
                return my_shift_state(event)
            if act == "on-shift":
                return on_shift_now()
            if act == "checklist":
                return get_checklist(event)
            if act == "head-tasks":
                return get_head_tasks(event)
            return get_shifts(event)
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            act = str(body.get("action") or "")
            if act in ("start", "finish"):
                return mark_shift(event, body, act)
            if act == "checklist":
                return save_checklist(event, body)
            if act == "head-tasks":
                return save_head_tasks(event, body)
            return save_shift(event)
        if method == "DELETE":
            return delete_shift(event)
        return _json(405, {"error": "Method not allowed"})
    except Exception as e:
        return _json(500, {"error": str(e)})


def _admins(cur):
    cur.execute(
        "SELECT id, full_name, job_title FROM staff "
        "WHERE role IN ('admin', 'head') AND status = 'active' "
        "ORDER BY role DESC, full_name"
    )
    return [dict(r) for r in cur.fetchall()]


def _me(cur, event):
    """Кто вызывает — по токену админки."""
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    if not token:
        return None
    cur.execute(
        "SELECT s.id, s.full_name, s.role FROM staff_sessions ss "
        "JOIN staff s ON s.id = ss.staff_id "
        "WHERE ss.token = %s AND ss.expires_at > now() AND s.status = 'active'",
        (token,),
    )
    row = cur.fetchone()
    return dict(row) if row else None


def mark_shift(event: dict, body: dict, act: str) -> dict:
    """Отметка «на смене» и «смена закончена» самим администратором.

    Ставится в тот день графика, где этот администратор запланирован.
    Если смены на сегодня в графике нет — создаём её, чтобы отметка не потерялась.
    """
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})

            date = str(body.get("date") or "")[:10]
            if len(date) != 10:
                return _json(400, {"error": "date required"})

            cur.execute(
                "SELECT id, started_at, finished_at FROM admin_shifts "
                "WHERE staff_id = %s AND shift_date = %s",
                (me["id"], date),
            )
            row = cur.fetchone()

            if not row:
                cur.execute(
                    "INSERT INTO admin_shifts (staff_id, staff_name, shift_date, time_from, time_to, kind) "
                    "VALUES (%s, %s, %s, '', '', 'work') RETURNING id",
                    (me["id"], me["full_name"], date),
                )
                row = cur.fetchone()

            field = "started_at" if act == "start" else "finished_at"
            cur.execute(
                f"UPDATE admin_shifts SET {field} = {MSK_NOW}, updated_at = {MSK_NOW} "
                f"WHERE id = %s RETURNING "
                f"to_char(started_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS started_at, "
                f"to_char(finished_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS finished_at",
                (row["id"],),
            )
            marks = dict(cur.fetchone())
            conn.commit()
        return _json(200, {"ok": True, **marks})
    finally:
        conn.close()


def my_shift_state(event: dict) -> dict:
    """Состояние смены администратора на сегодня — для кнопки в кабинете."""
    params = event.get("queryStringParameters") or {}
    date = str(params.get("date") or "")[:10]
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})
            if len(date) != 10:
                return _json(400, {"error": "date required"})
            cur.execute(
                "SELECT to_char(started_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS started_at, "
                "to_char(finished_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS finished_at, kind "
                "FROM admin_shifts WHERE staff_id = %s AND shift_date = %s",
                (me["id"], date),
            )
            row = cur.fetchone()
        return _json(200, {
            "ok": True,
            "started_at": (row or {}).get("started_at"),
            "finished_at": (row or {}).get("finished_at"),
            "planned": bool(row),
        })
    finally:
        conn.close()


def on_shift_now() -> dict:
    """Кто из администраторов сейчас на смене — открытый список для «Окна взаимодействия».

    На смене = сегодня нажал «На смене» и ещё не нажал «Смена закончена».
    """
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f"SELECT sh.staff_id, sh.staff_name, s.job_title, s.role, "
                f"to_char(sh.started_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS started_at "
                f"FROM admin_shifts sh "
                f"LEFT JOIN staff s ON s.id = sh.staff_id "
                f"WHERE sh.shift_date = {MSK_TODAY} "
                f"AND sh.started_at IS NOT NULL AND sh.finished_at IS NULL "
                f"ORDER BY sh.started_at",
                (),
            )
            rows = [dict(r) for r in cur.fetchall()]
        return _json(200, {"ok": True, "on_shift": rows, "count": len(rows)})
    finally:
        conn.close()


def get_shifts(event: dict) -> dict:
    """Смены за месяц: ?month=YYYY-MM. Возвращает список смен и список администраторов."""
    params = event.get("queryStringParameters") or {}
    month = str(params.get("month") or "")[:7]
    if len(month) != 7:
        return _json(400, {"error": "month required in format YYYY-MM"})

    first = month + "-01"

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, staff_id, staff_name, shift_date, time_from, time_to, kind, note, "
                "to_char(started_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS started_at, "
                "to_char(finished_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS finished_at "
                "FROM admin_shifts "
                "WHERE shift_date >= %s::date "
                "AND shift_date < (%s::date + INTERVAL '1 month') "
                "ORDER BY shift_date, staff_name",
                (first, first),
            )
            shifts = [dict(r) for r in cur.fetchall()]
            admins = _admins(cur)

            # Задачи из журнала административного учёта за тот же месяц —
            # показываем их в подсказке на ячейке графика
            cur.execute(
                f"SELECT staff_id, to_char(log_date, 'YYYY-MM-DD') AS log_date, "
                f"task_code, task_title, subject, minutes "
                f"FROM {SCHEMA}.work_log "
                f"WHERE log_date >= %s::date AND log_date < (%s::date + INTERVAL '1 month') "
                f"ORDER BY log_date, id",
                (first, first),
            )
            tasks = [dict(r) for r in cur.fetchall()]
        return _json(200, {
            "shifts": shifts, "admins": admins, "month": month, "tasks": tasks,
        })
    finally:
        conn.close()


def save_shift(event: dict) -> dict:
    """Создать или обновить смену.
    Body: { staff_id, date, time_from, time_to, kind, note }
    """
    body = json.loads(event.get("body") or "{}")

    try:
        staff_id = int(body.get("staff_id"))
    except (TypeError, ValueError):
        return _json(400, {"error": "staff_id required"})

    date = str(body.get("date") or "")[:10]
    if len(date) != 10:
        return _json(400, {"error": "date required in format YYYY-MM-DD"})

    kind = str(body.get("kind") or "work")
    if kind not in KINDS:
        return _json(400, {"error": "unknown kind"})

    time_from = str(body.get("time_from") or "09:00")[:5]
    time_to = str(body.get("time_to") or "18:00")[:5]
    if kind != "work":
        time_from = ""
        time_to = ""
    note = str(body.get("note") or "")[:500]

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT full_name FROM staff WHERE id = %s", (staff_id,))
            row = cur.fetchone()
            if not row:
                return _json(400, {"error": "staff not found"})
            staff_name = row["full_name"]

            cur.execute(
                "INSERT INTO admin_shifts (staff_id, staff_name, shift_date, time_from, time_to, kind, note) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "ON CONFLICT (staff_id, shift_date) DO UPDATE SET "
                "time_from = EXCLUDED.time_from, time_to = EXCLUDED.time_to, "
                "kind = EXCLUDED.kind, note = EXCLUDED.note, "
                f"staff_name = EXCLUDED.staff_name, updated_at = {MSK_NOW} "
                f"RETURNING id, staff_id, staff_name, shift_date, time_from, time_to, kind, note, "
                f"to_char(started_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS started_at, "
                f"to_char(finished_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS finished_at",
                (staff_id, staff_name, date, time_from, time_to, kind, note),
            )
            saved = dict(cur.fetchone())
            conn.commit()
        return _json(200, {"ok": True, "shift": saved})
    finally:
        conn.close()


def get_head_tasks(event: dict) -> dict:
    """Задачи руководителя на дату: ?action=head-tasks&date=YYYY-MM-DD или &month=YYYY-MM"""
    params = event.get("queryStringParameters") or {}
    date = str(params.get("date") or "")[:10]
    month = str(params.get("month") or "")[:7]

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if len(date) == 10:
                cur.execute(
                    f"SELECT id, to_char(shift_date, 'YYYY-MM-DD') AS shift_date, "
                    f"staff_id, title FROM {SCHEMA}.shift_head_tasks "
                    f"WHERE shift_date = %s ORDER BY id",
                    (date,),
                )
            elif len(month) == 7:
                first = month + "-01"
                cur.execute(
                    f"SELECT id, to_char(shift_date, 'YYYY-MM-DD') AS shift_date, "
                    f"staff_id, title FROM {SCHEMA}.shift_head_tasks "
                    f"WHERE shift_date >= %s::date "
                    f"AND shift_date < (%s::date + INTERVAL '1 month') ORDER BY shift_date, id",
                    (first, first),
                )
            else:
                return _json(400, {"error": "date or month required"})
            rows = [dict(r) for r in cur.fetchall()]
        return _json(200, {"ok": True, "tasks": rows})
    finally:
        conn.close()


def save_head_tasks(event: dict, body: dict) -> dict:
    """Полностью переписывает задачи руководителя на дату.

    Body: { action: 'head-tasks', date, tasks: [{ staff_id, title }] }
    """
    date = str(body.get("date") or "")[:10]
    if len(date) != 10:
        return _json(400, {"error": "date required"})
    tasks = body.get("tasks") or []

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})

            cur.execute(f"DELETE FROM {SCHEMA}.shift_head_tasks WHERE shift_date = %s", (date,))
            for t in tasks:
                title = str(t.get("title") or "").strip()[:300]
                if not title:
                    continue
                try:
                    sid = int(t.get("staff_id"))
                except (TypeError, ValueError):
                    continue
                cur.execute(
                    f"INSERT INTO {SCHEMA}.shift_head_tasks "
                    f"(shift_date, staff_id, title, created_by) VALUES (%s, %s, %s, %s)",
                    (date, sid, title, me["id"]),
                )
            conn.commit()

            cur.execute(
                f"SELECT id, to_char(shift_date, 'YYYY-MM-DD') AS shift_date, staff_id, title "
                f"FROM {SCHEMA}.shift_head_tasks WHERE shift_date = %s ORDER BY id",
                (date,),
            )
            rows = [dict(r) for r in cur.fetchall()]
        return _json(200, {"ok": True, "tasks": rows})
    finally:
        conn.close()


def get_checklist(event: dict) -> dict:
    """Мой чек-лист за день: отметки и задачи руководителя лично мне.

    ?action=checklist&date=YYYY-MM-DD
    Руководитель может смотреть чужой: &staff_id=N
    """
    params = event.get("queryStringParameters") or {}
    date = str(params.get("date") or "")[:10]
    if len(date) != 10:
        return _json(400, {"error": "date required"})

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})

            staff_id = me["id"]
            asked = params.get("staff_id")
            if asked and me.get("role") == "head":
                staff_id = int(asked)

            cur.execute(
                f"SELECT item_key, done, comment FROM {SCHEMA}.shift_checklist "
                f"WHERE shift_date = %s AND staff_id = %s",
                (date, staff_id),
            )
            marks = [dict(r) for r in cur.fetchall()]

            cur.execute(
                f"SELECT id, title FROM {SCHEMA}.shift_head_tasks "
                f"WHERE shift_date = %s AND staff_id = %s ORDER BY id",
                (date, staff_id),
            )
            head_tasks = [dict(r) for r in cur.fetchall()]
        return _json(200, {"ok": True, "marks": marks, "head_tasks": head_tasks})
    finally:
        conn.close()


def save_checklist(event: dict, body: dict) -> dict:
    """Сохранить отметку по пункту чек-листа.

    Body: { action: 'checklist', date, item_key, done, comment }
    """
    date = str(body.get("date") or "")[:10]
    item_key = str(body.get("item_key") or "")[:64]
    if len(date) != 10 or not item_key:
        return _json(400, {"error": "date and item_key required"})

    done = bool(body.get("done"))
    comment = str(body.get("comment") or "")[:1000]

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})

            cur.execute(
                f"INSERT INTO {SCHEMA}.shift_checklist "
                f"(shift_date, staff_id, item_key, done, comment) VALUES (%s, %s, %s, %s, %s) "
                f"ON CONFLICT (shift_date, staff_id, item_key) DO UPDATE SET "
                f"done = EXCLUDED.done, comment = EXCLUDED.comment, updated_at = {MSK_NOW}",
                (date, me["id"], item_key, done, comment),
            )
            conn.commit()
        return _json(200, {"ok": True})
    finally:
        conn.close()


def delete_shift(event: dict) -> dict:
    """Удалить смену: ?id=N либо ?staff_id=N&date=YYYY-MM-DD"""
    params = event.get("queryStringParameters") or {}
    sid = params.get("id")
    staff_id = params.get("staff_id")
    date = params.get("date")

    conn = db_conn()
    try:
        with conn.cursor() as cur:
            if sid:
                cur.execute("DELETE FROM admin_shifts WHERE id = %s", (int(sid),))
            elif staff_id and date:
                cur.execute(
                    "DELETE FROM admin_shifts WHERE staff_id = %s AND shift_date = %s",
                    (int(staff_id), str(date)[:10]),
                )
            else:
                return _json(400, {"error": "id or staff_id+date required"})
            conn.commit()
        return _json(200, {"ok": True})
    finally:
        conn.close()