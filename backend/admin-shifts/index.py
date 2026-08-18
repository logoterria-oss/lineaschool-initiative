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
            if str(params.get("action") or "") == "my-shift":
                return my_shift_state(event)
            return get_shifts(event)
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            act = str(body.get("action") or "")
            if act in ("start", "finish"):
                return mark_shift(event, body, act)
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

            if act == "start":
                cur.execute(
                    "UPDATE admin_shifts SET started_at = now(), updated_at = now() "
                    "WHERE id = %s RETURNING started_at, finished_at",
                    (row["id"],),
                )
            else:
                cur.execute(
                    "UPDATE admin_shifts SET finished_at = now(), updated_at = now() "
                    "WHERE id = %s RETURNING started_at, finished_at",
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
                "SELECT started_at, finished_at, kind FROM admin_shifts "
                "WHERE staff_id = %s AND shift_date = %s",
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
                "started_at, finished_at "
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
                "staff_name = EXCLUDED.staff_name, updated_at = now() "
                "RETURNING id, staff_id, staff_name, shift_date, time_from, time_to, kind, note, "
                "started_at, finished_at",
                (staff_id, staff_name, date, time_from, time_to, kind, note),
            )
            saved = dict(cur.fetchone())
            conn.commit()
        return _json(200, {"ok": True, "shift": saved})
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