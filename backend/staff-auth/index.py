import json
import os
import re
import base64
import hashlib
import secrets
from datetime import datetime, timedelta

import boto3
import requests
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

S20_HOST = "https://11086.s20.online"
S20_EMAIL = os.environ.get("ALFACRM_EMAIL", "abram.viktoriya.00@mail.ru")

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
        "avatar_url": row.get("avatar_url"),
        "job_title": row.get("job_title"),
    }


def s20_headers(token=None):
    h = {
        "X-APP-KEY": os.environ["S20_X_APP_KEY"],
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if token:
        h["X-ALFACRM-TOKEN"] = token
    return h


def s20_token():
    r = requests.post(
        f"{S20_HOST}/v2api/auth/login",
        json={"email": S20_EMAIL, "api_key": os.environ["S20_API_KEY"]},
        headers=s20_headers(), timeout=20)
    r.raise_for_status()
    return r.json()["token"]


def s20_employees(token):
    items = []
    page = 0
    while True:
        r = requests.post(
            f"{S20_HOST}/v2api/1/teacher/index",
            json={"page": page, "pageSize": 200},
            headers=s20_headers(token), timeout=30)
        r.raise_for_status()
        data = r.json()
        chunk = data.get("items", [])
        items.extend(chunk)
        if len(items) >= data.get("total", 0) or not chunk:
            break
        page += 1
    return items
    return items


def norm_name(s):
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def _collect_strings(obj, out):
    if isinstance(obj, str):
        out.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            _collect_strings(v, out)
    elif isinstance(obj, list):
        for v in obj:
            _collect_strings(v, out)


def match_in_s20(full_name, phone):
    """Ищем сотрудника в S20 по телефону ИЛИ ФИО. Возвращает True при совпадении.

    Схема employee может отличаться, поэтому сканируем все строковые значения записи:
    - телефон сравниваем по нормализованным цифрам,
    - ФИО сравниваем по нормализованному имени (точное совпадение).
    """
    token = s20_token()
    target_name = norm_name(full_name)
    for emp in s20_employees(token):
        strings = []
        _collect_strings(emp, strings)
        for s in strings:
            digits = normalize_phone(s)
            if len(digits) == 11 and digits == phone:
                return True
            if target_name and norm_name(s) == target_name:
                return True
    return False


def handler(event: dict, context) -> dict:
    """Авторизация сотрудников: регистрация по телефону, вход, проверка сессии, смена пароля."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    raw = event.get("body") or "{}"
    try:
        body = json.loads(raw)
    except Exception:
        body = {}
    qs = event.get("queryStringParameters") or {}
    action = body.get("action") or qs.get("action")

    conn = db()
    try:
        if action == "me" or (method == "GET" and not action):
            return handle_me(conn, event)
        if action == "register":
            return handle_register(conn, body)
        if action == "login":
            return handle_login(conn, body)
        if action == "change_password":
            return handle_change_password(conn, event, body)
        if action == "set_avatar":
            return handle_set_avatar(conn, event, body)
        if action == "set_title":
            return handle_set_title(conn, event, body)
        if action == "set_phone":
            return handle_set_phone(conn, event, body)
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

    # Проверяем совпадение в CRM S20 (по телефону ИЛИ ФИО).
    try:
        found = match_in_s20(full_name, phone)
    except Exception:
        return resp(502, {"error": "crm_unavailable",
                          "message": "Не удалось проверить данные в CRM, попробуйте позже"})
    if not found:
        return resp(403, {"error": "no_crm_match",
                          "message": "Нет совпадений в CRM. Проверьте телефон и ФИО или обратитесь к руководителю."})

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.staff (full_name, phone, password_hash, role, status) "
            f"VALUES (%s, %s, %s, %s, 'active') RETURNING id, full_name, phone, role, status",
            (full_name, phone, hash_password(password), role),
        )
        row = cur.fetchone()
        conn.commit()
    return resp(200, {"ok": True, "staff": public_staff(row),
                      "message": "Регистрация подтверждена. Теперь войдите по телефону и паролю."})


def handle_login(conn, body):
    phone = normalize_phone(body.get("phone"))
    password = body.get("password") or ""

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT id, full_name, phone, password_hash, role, status, avatar_url, job_title "
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
            f"SELECT s.id, s.full_name, s.phone, s.role, s.status, s.password_hash, s.avatar_url, s.job_title "
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


AVATAR_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
}


def handle_set_avatar(conn, event, body):
    row = session_staff(conn, event)
    if not row:
        return resp(401, {"error": "no_session"})
    if row["status"] != "active":
        return resp(403, {"error": row["status"]})

    content_type = (body.get("content_type") or "").lower()
    data_b64 = body.get("image_base64") or ""
    if content_type not in AVATAR_TYPES:
        return resp(400, {"error": "bad_type",
                          "message": "Поддерживаются PNG, JPG, WEBP или GIF"})
    if not data_b64:
        return resp(400, {"error": "no_image", "message": "Файл не передан"})

    try:
        raw = base64.b64decode(data_b64)
    except Exception:
        return resp(400, {"error": "bad_image", "message": "Не удалось прочитать файл"})
    if len(raw) > 5 * 1024 * 1024:
        return resp(400, {"error": "too_big", "message": "Файл больше 5 МБ"})

    ext = AVATAR_TYPES[content_type]
    key = f"avatars/{row['id']}_{secrets.token_hex(8)}.{ext}"
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=content_type)
    url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.staff SET avatar_url = %s, updated_at = now() WHERE id = %s",
            (url, row["id"]))
        conn.commit()
    return resp(200, {"ok": True, "avatar_url": url, "message": "Аватар обновлён"})


def handle_set_phone(conn, event, body):
    row = session_staff(conn, event)
    if not row:
        return resp(401, {"error": "no_session"})
    if row["status"] != "active":
        return resp(403, {"error": row["status"]})
    phone = normalize_phone(body.get("phone"))
    if len(phone) != 11:
        return resp(400, {"error": "bad_phone", "message": "Некорректный номер телефона"})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT id FROM {SCHEMA}.staff WHERE phone = %s AND id <> %s",
            (phone, row["id"]))
        if cur.fetchone():
            return resp(409, {"error": "phone_exists",
                              "message": "Этот телефон уже используется другим сотрудником"})
        cur.execute(
            f"UPDATE {SCHEMA}.staff SET phone = %s, updated_at = now() WHERE id = %s",
            (phone, row["id"]))
        conn.commit()
    return resp(200, {"ok": True, "phone": phone, "message": "Телефон изменён"})


def handle_set_title(conn, event, body):
    row = session_staff(conn, event)
    if not row:
        return resp(401, {"error": "no_session"})
    if row["status"] != "active":
        return resp(403, {"error": row["status"]})
    title = (body.get("job_title") or "").strip()
    if len(title) > 120:
        return resp(400, {"error": "too_long", "message": "Не больше 120 символов"})
    value = title or None
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.staff SET job_title = %s, updated_at = now() WHERE id = %s",
            (value, row["id"]))
        conn.commit()
    return resp(200, {"ok": True, "job_title": value, "message": "Должность сохранена"})


def handle_logout(conn, event):
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    if token:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {SCHEMA}.staff_sessions SET expires_at = now() WHERE token = %s", (token,))
            conn.commit()
    return resp(200, {"ok": True})