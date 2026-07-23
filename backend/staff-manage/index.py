import json
import os
import re

import psycopg2
import requests
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
STATUSES = {"pending", "active", "blocked"}


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


def caller(conn, event):
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
    """Управление сотрудниками (руководитель): список, ручное добавление/редактирование, импорт из CRM, роли, статусы."""
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
        if action == "delete":
            return handle_delete(conn, body, me)
        if action == "create":
            return handle_create(conn, body)
        if action == "update":
            return handle_update(conn, body)
        if action == "import_crm":
            return handle_import_crm(conn)
        return resp(400, {"error": "unknown_action"})
    finally:
        conn.close()


SELECT_FIELDS = "id, full_name, phone, email, job_title, role, status, source, crm_id, avatar_url, created_at"


def handle_list(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT {SELECT_FIELDS} FROM {SCHEMA}.staff ORDER BY "
            f"CASE status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, "
            f"full_name ASC")
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


def handle_delete(conn, body, me):
    staff_id = body.get("id")
    if staff_id == me["id"]:
        return resp(400, {"error": "self", "message": "Нельзя удалить свой аккаунт"})
    with conn.cursor() as cur:
        cur.execute(f"DELETE FROM {SCHEMA}.staff_sessions WHERE staff_id = %s", (staff_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.staff WHERE id = %s", (staff_id,))
        conn.commit()
    return resp(200, {"ok": True})


def handle_create(conn, body):
    full_name = (body.get("full_name") or "").strip()
    if not full_name:
        return resp(400, {"error": "no_name", "message": "Укажите ФИО"})
    phone = normalize_phone(body.get("phone"))
    email = (body.get("email") or "").strip() or None
    job_title = (body.get("job_title") or "").strip() or None
    role = body.get("role") if body.get("role") in ROLES else "teacher"
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if phone:
            cur.execute(f"SELECT id FROM {SCHEMA}.staff WHERE phone = %s", (phone,))
            if cur.fetchone():
                return resp(409, {"error": "phone_exists", "message": "Сотрудник с таким телефоном уже есть"})
        cur.execute(
            f"INSERT INTO {SCHEMA}.staff (full_name, phone, email, job_title, role, status, source, password_hash) "
            f"VALUES (%s, %s, %s, %s, %s, 'active', 'manual', '') RETURNING {SELECT_FIELDS}",
            (full_name, phone or "", email, job_title, role))
        row = cur.fetchone()
        conn.commit()
    return resp(200, {"ok": True, "staff": row})


def handle_update(conn, body):
    staff_id = body.get("id")
    if not staff_id:
        return resp(400, {"error": "no_id"})
    fields = []
    values = []
    if "full_name" in body:
        fields.append("full_name = %s")
        values.append((body.get("full_name") or "").strip())
    if "phone" in body:
        fields.append("phone = %s")
        values.append(normalize_phone(body.get("phone")))
    if "email" in body:
        fields.append("email = %s")
        values.append((body.get("email") or "").strip() or None)
    if "job_title" in body:
        fields.append("job_title = %s")
        values.append((body.get("job_title") or "").strip() or None)
    if "role" in body and body.get("role") in ROLES:
        fields.append("role = %s")
        values.append(body.get("role"))
    if not fields:
        return resp(400, {"error": "nothing_to_update"})
    fields.append("updated_at = now()")
    values.append(staff_id)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.staff SET {', '.join(fields)} WHERE id = %s RETURNING {SELECT_FIELDS}",
            tuple(values))
        row = cur.fetchone()
        conn.commit()
    return resp(200, {"ok": True, "staff": row})


# ---------- Импорт из CRM (S20) ----------

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


def s20_index(path, token):
    items = []
    page = 0
    while True:
        r = requests.post(
            f"{S20_HOST}{path}",
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


def _first_phone(val):
    if isinstance(val, list):
        val = val[0] if val else ""
    return normalize_phone(str(val or ""))


def _pick(d, keys):
    for k in keys:
        v = d.get(k)
        if v:
            return str(v).strip()
    return None


def handle_import_crm(conn):
    token = s20_token()
    employees = s20_index("/v2api/1/teacher/index", token)
    users = s20_index("/v2api/1/user/index", token)

    if employees:
        print("CRM teacher sample:", json.dumps(employees[0], ensure_ascii=False)[:800])

    # email из учёток по телефону/имени
    email_by_phone = {}
    email_by_name = {}
    for u in users:
        em = (u.get("email") or "").strip()
        if not em:
            continue
        ph = _first_phone(u.get("phone"))
        if ph:
            email_by_phone[ph] = em
        nm = re.sub(r"\s+", " ", (u.get("name") or "").strip().lower())
        if nm:
            email_by_name.setdefault(nm, em)

    added, updated = 0, 0
    with conn.cursor() as cur:
        for e in employees:
            crm_id = e.get("id")
            name = (e.get("name") or "").strip()
            if not name:
                continue
            phone = _first_phone(e.get("phone"))
            job_title = _pick(e, ["position", "post", "specialization", "note"])
            email = _pick(e, ["email"]) or email_by_phone.get(phone) \
                or email_by_name.get(re.sub(r"\s+", " ", name.lower()))

            cur.execute(
                f"SELECT id FROM {SCHEMA}.staff WHERE crm_id = %s OR (phone <> '' AND phone = %s) LIMIT 1",
                (crm_id, phone))
            existing = cur.fetchone()
            if existing:
                cur.execute(
                    f"UPDATE {SCHEMA}.staff SET crm_id = COALESCE(crm_id, %s), source = 'crm', "
                    f"email = COALESCE(email, %s), job_title = COALESCE(job_title, %s), "
                    f"phone = CASE WHEN phone = '' THEN %s ELSE phone END, updated_at = now() "
                    f"WHERE id = %s",
                    (crm_id, email, job_title, phone or "", existing[0]))
                updated += 1
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.staff (full_name, phone, email, job_title, role, status, source, crm_id, password_hash) "
                    f"VALUES (%s, %s, %s, %s, 'teacher', 'active', 'crm', %s, '')",
                    (name, phone or "", email, job_title, crm_id))
                added += 1
        conn.commit()
    return resp(200, {"ok": True, "added": added, "updated": updated, "total_crm": len(employees)})
