import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    # (DELETE используется для удаления выходных/отпусков педагога)
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}

TEACHERS = {
    2: "Анастасия Шишаева",
    18: "Анна Карамова",
    11: "Валерия Камнева",
    4: "Дарья Еремина",
    20: "Екатерина Канкулова",
    15: "Екатерина Мацвей",
}


def db_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """CRUD графика работы педагогов — хранится в нашей БД"""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        params = event.get("queryStringParameters") or {}
        resource = params.get("resource")
        if resource == "absences":
            if method == "GET":
                return get_absences(event)
            if method == "POST":
                return add_absence(event)
            if method == "DELETE":
                return delete_absence(event)
        if method == "GET":
            return get_schedule(event)
        if method == "POST":
            return save_schedule(event)
        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}, ensure_ascii=False),
        }


def get_schedule(event: dict) -> dict:
    """Получить график всех педагогов или одного (?teacher_id=N)"""
    params = event.get("queryStringParameters") or {}
    teacher_id = params.get("teacher_id")

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if teacher_id:
                cur.execute(
                    "SELECT id, teacher_id, teacher_name, weekday, time_from, time_to "
                    "FROM teacher_work_schedule WHERE teacher_id = %s "
                    "ORDER BY weekday, time_from",
                    (int(teacher_id),)
                )
            else:
                cur.execute(
                    "SELECT id, teacher_id, teacher_name, weekday, time_from, time_to "
                    "FROM teacher_work_schedule ORDER BY teacher_id, weekday, time_from"
                )
            rows = cur.fetchall()

        teachers_list = [{"id": tid, "name": name} for tid, name in TEACHERS.items()]
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"schedule": [dict(r) for r in rows], "teachers": teachers_list},
                               ensure_ascii=False),
        }
    finally:
        conn.close()


def save_schedule(event: dict) -> dict:
    """Сохранить график педагога (полная замена слотов для teacher_id).
    Body: { "teacher_id": 2, "slots": [ {"weekday": 2, "time_from": "14:00", "time_to": "15:00"}, ... ] }
    """
    body = json.loads(event.get("body") or "{}")
    teacher_id = int(body.get("teacher_id"))
    slots = body.get("slots") or []

    if teacher_id not in TEACHERS:
        return {
            "statusCode": 400,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": f"Unknown teacher_id={teacher_id}"}),
        }

    teacher_name = TEACHERS[teacher_id]

    conn = db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM teacher_work_schedule WHERE teacher_id = %s", (teacher_id,))
            for s in slots:
                weekday = int(s["weekday"])
                tf = str(s["time_from"])[:5]
                tt = str(s["time_to"])[:5]
                if not (0 <= weekday <= 6):
                    continue
                cur.execute(
                    "INSERT INTO teacher_work_schedule "
                    "(teacher_id, teacher_name, weekday, time_from, time_to) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (teacher_id, teacher_name, weekday, tf, tt)
                )
            conn.commit()
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "saved": len(slots), "teacher_id": teacher_id}),
        }
    finally:
        conn.close()


def _json(status, payload):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False, default=str),
    }


def get_absences(event: dict) -> dict:
    """Выходные и отпуска педагога (?teacher_id=N)."""
    params = event.get("queryStringParameters") or {}
    teacher_id = params.get("teacher_id")
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if teacher_id:
                cur.execute(
                    "SELECT id, teacher_id, kind, date_from, date_to, time_from, time_to, note, substitute_name "
                    "FROM teacher_absences WHERE teacher_id = %s ORDER BY date_from",
                    (int(teacher_id),),
                )
            else:
                cur.execute(
                    "SELECT id, teacher_id, kind, date_from, date_to, time_from, time_to, note, substitute_name "
                    "FROM teacher_absences ORDER BY teacher_id, date_from"
                )
            rows = cur.fetchall()
        return _json(200, {"absences": [dict(r) for r in rows]})
    finally:
        conn.close()


def add_absence(event: dict) -> dict:
    """Добавить выходной или отпуск.
    Body: { teacher_id, kind: 'dayoff'|'vacation', date_from, date_to, time_from?, time_to?, note? }
    Для выходного date_to = date_from. time_from/time_to опциональны (NULL = весь день).
    """
    body = json.loads(event.get("body") or "{}")
    teacher_id = int(body.get("teacher_id"))
    if teacher_id not in TEACHERS:
        return _json(400, {"error": f"Unknown teacher_id={teacher_id}"})

    kind = body.get("kind") or "dayoff"
    if kind not in ("dayoff", "vacation"):
        return _json(400, {"error": "kind must be dayoff or vacation"})

    date_from = str(body.get("date_from") or "")[:10]
    date_to = str(body.get("date_to") or date_from)[:10]
    if not date_from:
        return _json(400, {"error": "date_from required"})
    if date_to < date_from:
        date_to = date_from

    time_from = body.get("time_from")
    time_to = body.get("time_to")
    time_from = str(time_from)[:5] if time_from else None
    time_to = str(time_to)[:5] if time_to else None
    # Время имеет смысл только для выходного одного дня
    if kind == "vacation":
        time_from = None
        time_to = None

    note = str(body.get("note") or "")
    # Кто подменяет педагога на время отпуска. Пусто — замены нет.
    substitute = str(body.get("substitute_name") or "").strip()

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO teacher_absences "
                "(teacher_id, teacher_name, kind, date_from, date_to, time_from, time_to, note, substitute_name) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
                "RETURNING id, teacher_id, kind, date_from, date_to, time_from, time_to, note, substitute_name",
                (teacher_id, TEACHERS[teacher_id], kind, date_from, date_to, time_from, time_to, note, substitute),
            )
            row = cur.fetchone()
            conn.commit()
        return _json(200, {"ok": True, "absence": dict(row)})
    finally:
        conn.close()


def delete_absence(event: dict) -> dict:
    """Удалить выходной/отпуск по id (?id=N или body {id})."""
    params = event.get("queryStringParameters") or {}
    aid = params.get("id")
    if not aid:
        body = json.loads(event.get("body") or "{}")
        aid = body.get("id")
    if not aid:
        return _json(400, {"error": "id required"})
    conn = db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM teacher_absences WHERE id = %s", (int(aid),))
            conn.commit()
        return _json(200, {"ok": True, "deleted": int(aid)})
    finally:
        conn.close()