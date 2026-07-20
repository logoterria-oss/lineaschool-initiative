import json
import os

import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

ROLES = {"teacher", "diag", "admin", "head"}
STATUSES = {"pending", "active", "blocked"}


def resp(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def caller(conn, event):
    """Возвращает сотрудника по токену сессии, если он активен."""
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    if not token:
        token = (event.get("queryStringParameters") or {}).get("token")
    if not token:
        return None
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT s.id, s.role, s.status FROM {SCHEMA}.staff_sessions ss "
            f"JOIN {SCHEMA}.staff s ON s.id = ss.staff_id "
            f"WHERE ss.token = %s AND ss.expires_at > now()", (token,))
        return cur.fetchone()


def handler(event: dict, context) -> dict:
    """Управление сотрудниками (только руководитель): список, подтверждение, смена роли, блокировка."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = db()
    try:
        me = caller(conn, event)
        if not me:
            return resp(401, {"error": "no_session"})
        if me["status"] != "active" or me["role"] != "head":
            return resp(403, {"error": "forbidden", "message": "Доступ только для руководителя"})

        method = event.get("httpMethod", "GET")
        if method == "GET":
            return handle_list(conn)

        body = json.loads(event.get("body") or "{}")
        action = body.get("action")
        if action == "set_status":
            return handle_set_status(conn, body, me)
        if action == "set_role":
            return handle_set_role(conn, body)
        return resp(400, {"error": "unknown_action"})
    finally:
        conn.close()


def handle_list(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT id, full_name, phone, role, status, created_at "
            f"FROM {SCHEMA}.staff ORDER BY "
            f"CASE status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, "
            f"created_at DESC")
        rows = cur.fetchall()
    return resp(200, {"staff": rows})


def handle_set_status(conn, body, me):
    staff_id = body.get("id")
    status = body.get("status")
    if status not in STATUSES:
        return resp(400, {"error": "bad_status"})
    if staff_id == me["id"] and status != "active":
        return resp(400, {"error": "self", "message": "Нельзя изменить статус своего аккаунта"})
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.staff SET status = %s, updated_at = now() WHERE id = %s",
            (status, staff_id))
        conn.commit()
    return resp(200, {"ok": True})


def handle_set_role(conn, body):
    staff_id = body.get("id")
    role = body.get("role")
    if role not in ROLES:
        return resp(400, {"error": "bad_role"})
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.staff SET role = %s, updated_at = now() WHERE id = %s",
            (role, staff_id))
        conn.commit()
    return resp(200, {"ok": True})
