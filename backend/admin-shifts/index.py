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
            return get_shifts(event)
        if method == "POST":
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
                "SELECT id, staff_id, staff_name, shift_date, time_from, time_to, kind, note "
                "FROM admin_shifts "
                "WHERE shift_date >= %s::date "
                "AND shift_date < (%s::date + INTERVAL '1 month') "
                "ORDER BY shift_date, staff_name",
                (first, first),
            )
            shifts = [dict(r) for r in cur.fetchall()]
            admins = _admins(cur)
        return _json(200, {"shifts": shifts, "admins": admins, "month": month})
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
                "RETURNING id, staff_id, staff_name, shift_date, time_from, time_to, kind, note",
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
