import json
import os
import re
import hashlib
import secrets
from datetime import datetime, timedelta

import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

ROLES = {"teacher", "diag", "admin", "head"}
SESSION_DAYS = 30


def resp(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def normalize_phone(raw):
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 11 and digits[0] == "8":
        digits = "7" + digits[1:]
    if len(digits) == 10:
        digits = "7" + digits
    return digits


def hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}${dk.hex()}"


def verify_password(password, stored):
    try:
        salt, _ = stored.split("$", 1)
    except ValueError:
        return False
    return hmac_equal(hash_password(password, salt), stored)


def hmac_equal(a, b):
    return secrets.compare_digest(a, b)


def public_staff(row):
    return {
        "id": row["id"],
        "full_name": row["full_name"],
        "phone": row["phone"],
        "role": row["role"],
        "status": row["status"],
    }


def handler(event: dict, context) -> dict:
    """Авторизация сотрудников: регистрация по телефону, вход, проверка сессии, смена пароля."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action") or (event.get("queryStringParameters") or {}).get("action")

    conn = db()
    try:
        if method == "GET" or action == "me":
            return handle_me(conn, event)
        if action == "register":
            return handle_register(conn, body)
        if action == "login":
            return handle_login(conn, body)
        if action == "change_password":
            return handle_change_password(conn, event, body)
        if action == "logout":
            return handle_logout(conn, event)
        return resp(400, {"error": "unknown_action"})
    finally:
        conn.close()


def handle_register(conn, body):
    full_name = (body.get("full_name") or "").strip()
    phone = normalize_phone(body.get("phone"))
    password = body.get("password") or ""
    role = body.get("role") or "teacher"

    if not full_name:
        return resp(400, {"error": "no_name", "message": "Укажите ФИО"})
    if len(phone) != 11:
        return resp(400, {"error": "bad_phone", "message": "Некорректный номер телефона"})
    if len(password) < 6:
        return resp(400, {"error": "weak_password", "message": "Пароль минимум 6 символов"})
    if role not in ROLES:
        return resp(400, {"error": "bad_role", "message": "Некорректная роль"})

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"SELECT id FROM {SCHEMA}.staff WHERE phone = %s", (phone,))
        if cur.fetchone():
            return resp(409, {"error": "phone_exists", "message": "Этот телефон уже зарегистрирован"})
        cur.execute(
            f"INSERT INTO {SCHEMA}.staff (full_name, phone, password_hash, role, status) "
            f"VALUES (%s, %s, %s, %s, 'pending') RETURNING id, full_name, phone, role, status",
            (full_name, phone, hash_password(password), role),
        )
        row = cur.fetchone()
        conn.commit()
    return resp(200, {"ok": True, "staff": public_staff(row),
                      "message": "Заявка отправлена. Дождитесь подтверждения руководителя."})


def handle_login(conn, body):
    phone = normalize_phone(body.get("phone"))
    password = body.get("password") or ""

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT id, full_name, phone, password_hash, role, status "
            f"FROM {SCHEMA}.staff WHERE phone = %s", (phone,))
        row = cur.fetchone()
        if not row or not verify_password(password, row["password_hash"]):
            return resp(401, {"error": "bad_credentials", "message": "Неверный телефон или пароль"})
        if row["status"] == "pending":
            return resp(403, {"error": "pending", "message": "Аккаунт ожидает подтверждения руководителем"})
        if row["status"] == "blocked":
            return resp(403, {"error": "blocked", "message": "Аккаунт заблокирован"})

        token = secrets.token_hex(32)
        expires = datetime.utcnow() + timedelta(days=SESSION_DAYS)
        cur.execute(
            f"INSERT INTO {SCHEMA}.staff_sessions (token, staff_id, expires_at) VALUES (%s, %s, %s)",
            (token, row["id"], expires),
        )
        conn.commit()
    return resp(200, {"ok": True, "token": token, "staff": public_staff(row)})


def session_staff(conn, event):
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    if not token:
        token = (event.get("queryStringParameters") or {}).get("token")
    if not token:
        return None
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT s.id, s.full_name, s.phone, s.role, s.status, s.password_hash "
            f"FROM {SCHEMA}.staff_sessions ss JOIN {SCHEMA}.staff s ON s.id = ss.staff_id "
            f"WHERE ss.token = %s AND ss.expires_at > now()", (token,))
        return cur.fetchone()


def handle_me(conn, event):
    row = session_staff(conn, event)
    if not row:
        return resp(401, {"error": "no_session"})
    if row["status"] != "active":
        return resp(403, {"error": row["status"]})
    return resp(200, {"staff": public_staff(row)})


def handle_change_password(conn, event, body):
    row = session_staff(conn, event)
    if not row:
        return resp(401, {"error": "no_session"})
    old = body.get("old_password") or ""
    new = body.get("new_password") or ""
    if not verify_password(old, row["password_hash"]):
        return resp(403, {"error": "bad_old", "message": "Текущий пароль неверный"})
    if len(new) < 6:
        return resp(400, {"error": "weak_password", "message": "Пароль минимум 6 символов"})
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.staff SET password_hash = %s, updated_at = now() WHERE id = %s",
            (hash_password(new), row["id"]))
        conn.commit()
    return resp(200, {"ok": True, "message": "Пароль изменён"})


def handle_logout(conn, event):
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    if token:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.staff_sessions SET expires_at = now() WHERE token = %s", (token,))
            conn.commit()
    return resp(200, {"ok": True})
