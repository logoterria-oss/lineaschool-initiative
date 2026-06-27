import os
import json
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta, date

"""
Таблица учеников для кабинета администратора.
Источник: AlfaCRM S20 (статусы, занятия). Диагностики — таблица student_diagnostics.

Режимы:
  GET ?mode=statuses : справочник статусов обучения из CRM + распределение
  GET ?mode=list     : ученики со статусом, последней и следующей диагностикой
  POST {action:'save_diag', student_id, student_name, diagnostic_date,
        recommendations, report_link, is_first}
"""

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"
SCHEMA = "t_p93118852_lineaschool_initiati"

# Маппинг кодов статусов CRM (study_status_id) на названия.
# 1=Активен, 2=Завершил, 3=Бросил, 4=Каникулы-заморожен, 5=Каникулы
STATUS_NAMES = {1: "Активен", 2: "Завершил", 3: "Бросил",
                4: "Каникулы (заморожен)", 5: "Каникулы"}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
    "Access-Control-Max-Age": "86400",
}


def _json(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_headers(token=None):
    h = {
        "X-APP-KEY": os.environ["S20_X_APP_KEY"],
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if token:
        h["X-ALFACRM-TOKEN"] = token
    return h


def get_token():
    url = f"{S20_HOST}/v2api/auth/login"
    resp = requests.post(url, json={
        "email": S20_EMAIL,
        "api_key": os.environ["S20_API_KEY"],
    }, headers=get_headers(), timeout=20)
    resp.raise_for_status()
    return resp.json()["token"]


def get_study_statuses(token):
    url = f"{S20_HOST}/v2api/1/study-status/index"
    resp = requests.post(url, json={"page": 0, "pageSize": 200},
                         headers=get_headers(token), timeout=20)
    resp.raise_for_status()
    return resp.json().get("items", [])


def fetch_customers_raw(token, is_study=None, removed=None):
    url = f"{S20_HOST}/v2api/1/customer/index"
    all_items = []
    page = 0
    while True:
        payload = {"page": page, "pageSize": 200}
        if is_study is not None:
            payload["is_study"] = is_study
        if removed is not None:
            payload["removed"] = removed
        resp = requests.post(url, json=payload, headers=get_headers(token), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        all_items.extend(items)
        if len(all_items) >= data.get("total", 0) or not items:
            break
        page += 1
    return all_items


def get_all_customers(token):
    seen = set()
    merged = []
    for is_study_flag, removed_flag in ((1, 0), (1, 1)):
        try:
            for it in fetch_customers_raw(token, is_study=is_study_flag, removed=removed_flag):
                cid = it.get("id")
                if cid in seen:
                    continue
                seen.add(cid)
                merged.append(it)
        except Exception as e:
            print(f"customers fetch failed: {e}")
    return merged


def get_lessons(token, date_from, date_to, status=3):
    """Занятия за период. status=3 — проведённые, None — все."""
    url = f"{S20_HOST}/v2api/1/lesson/index"
    all_items = []
    page = 0
    while True:
        payload = {"date_from": date_from, "date_to": date_to,
                   "page": page, "pageSize": 200}
        if status is not None:
            payload["status"] = status
        resp = requests.post(url, json=payload, headers=get_headers(token), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        all_items.extend(items)
        if len(all_items) >= data.get("total", 0) or not items:
            break
        page += 1
    return all_items


def get_done_lessons(token, date_from, date_to):
    return get_lessons(token, date_from, date_to, status=3)


def get_customer_tariffs(token, customer_id):
    """Абонементы ученика из CRM (customer-tariff)."""
    url = f"{S20_HOST}/v2api/1/customer-tariff/index"
    resp = requests.post(url, json={"customer_id": customer_id, "page": 0, "pageSize": 50},
                         headers=get_headers(token), timeout=20)
    resp.raise_for_status()
    return resp.json().get("items", [])


def lesson_customer_ids(ls):
    cids = set()
    for key in ("customer_ids", "client_ids", "student_ids"):
        for sid in (ls.get(key) or []):
            cids.add(sid)
    details = ls.get("details")
    if isinstance(details, list):
        for d in details:
            if isinstance(d, dict):
                cid = d.get("customer_id") or d.get("client_id")
                if cid is not None:
                    cids.add(cid)
    return cids


def iso_week_key(d):
    y, w, _ = d.isocalendar()
    return (y, w)


def compute_next_diag(prev_date, active_week_keys):
    """Предыдущая дата + 3 месяца чистого обучения. Дни в неделях без занятий
    (перерыв неделя или более) не засчитываются в срок."""
    target_active_days = 90
    cur = prev_date
    active_days = 0
    guard = 0
    while active_days < target_active_days and guard < 365 * 3:
        cur = cur + timedelta(days=1)
        guard += 1
        if iso_week_key(cur) in active_week_keys:
            active_days += 1
    return cur


def plain_plus_3_months(prev):
    m = prev.month - 1 + 3
    y = prev.year + m // 12
    mm = m % 12 + 1
    day = min(prev.day, 28)
    return date(y, mm, day)


def handle_statuses(token):
    statuses = get_study_statuses(token)
    customers = get_all_customers(token)
    dist = {}
    for c in customers:
        sid = c.get("study_status_id")
        dist[sid] = dist.get(sid, 0) + 1
    return _json(200, {
        "statuses": [{"id": s.get("id"), "name": s.get("name")} for s in statuses],
        "distribution": dist,
        "total_customers": len(customers),
    })


def load_diagnostics():
    """student_id -> [rows] (по убыванию даты)."""
    conn = db()
    by_student = {}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT id, student_id, student_name, diagnostic_date, recommendations, "
            f"report_link, is_first FROM {SCHEMA}.student_diagnostics "
            f"ORDER BY diagnostic_date DESC, id DESC"
        )
        for r in cur.fetchall():
            d = dict(r)
            d["diagnostic_date"] = str(d["diagnostic_date"])
            by_student.setdefault(r["student_id"], []).append(d)
    conn.close()
    return by_student


def handle_list(token):
    customers = get_all_customers(token)
    diags = load_diagnostics()

    earliest = None
    for rows in diags.values():
        for r in rows:
            dd = datetime.strptime(r["diagnostic_date"], "%Y-%m-%d").date()
            if earliest is None or dd < earliest:
                earliest = dd

    active_weeks_by_student = {}
    if earliest:
        today = date.today()
        date_from = earliest.strftime("%Y-%m-%d")
        date_to = (today + timedelta(days=180)).strftime("%Y-%m-%d")
        try:
            lessons = get_done_lessons(token, date_from, date_to)
            for ls in lessons:
                ld = (ls.get("date") or "")[:10]
                if not ld:
                    continue
                try:
                    ldate = datetime.strptime(ld, "%Y-%m-%d").date()
                except ValueError:
                    continue
                wk = iso_week_key(ldate)
                for cid in lesson_customer_ids(ls):
                    active_weeks_by_student.setdefault(cid, set()).add(wk)
        except Exception as e:
            print(f"lessons fetch failed: {e}")

    items = []
    for c in customers:
        sid = c.get("id")
        status_id = c.get("study_status_id")
        student_diags = diags.get(sid, [])
        last = student_diags[0] if student_diags else None

        next_date = None
        if last:
            prev = datetime.strptime(last["diagnostic_date"], "%Y-%m-%d").date()
            weeks = active_weeks_by_student.get(sid, set())
            if weeks:
                next_date = compute_next_diag(prev, weeks).strftime("%Y-%m-%d")
            else:
                next_date = plain_plus_3_months(prev).strftime("%Y-%m-%d")

        items.append({
            "id": sid,
            "name": c.get("name"),
            "status_id": status_id,
            "status_name": STATUS_NAMES.get(status_id, "—"),
            "last_diagnostic": last["diagnostic_date"] if last else None,
            "last_recommendations": last["recommendations"] if last else None,
            "last_report_link": last["report_link"] if last else None,
            "next_diagnostic": next_date,
            "diagnostics_count": len(student_diags),
        })

    items.sort(key=lambda x: (x.get("name") or "").lower())
    return _json(200, {"items": items})


def handle_save_diag(body):
    student_id = body.get("student_id")
    student_name = (body.get("student_name") or "").strip()
    diagnostic_date = (body.get("diagnostic_date") or "").strip()
    recommendations = (body.get("recommendations") or "").strip() or None
    report_link = (body.get("report_link") or "").strip() or None
    is_first = bool(body.get("is_first"))

    if not student_id or not student_name:
        return _json(400, {"error": "student required"})
    if not diagnostic_date:
        return _json(400, {"error": "diagnostic_date required"})

    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.student_diagnostics "
            f"(student_id, student_name, diagnostic_date, recommendations, report_link, is_first) "
            f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (int(student_id), student_name, diagnostic_date, recommendations,
             report_link, is_first),
        )
        new_id = cur.fetchone()["id"]
        conn.commit()
    conn.close()
    return _json(200, {"success": True, "id": new_id})


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        action = body.get("action")
        if action == "save_diag":
            return handle_save_diag(body)
        return _json(400, {"error": "unknown action"})

    params = event.get("queryStringParameters") or {}
    mode = params.get("mode", "list")

    try:
        token = get_token()
    except Exception as e:
        return _json(502, {"error": f"CRM auth error: {str(e)}"})

    if mode == "statuses":
        return handle_statuses(token)
    if mode == "list":
        return handle_list(token)
    if mode == "debug":
        return handle_debug(token, params)
    if mode == "tariff":
        cid = int(params.get("customer_id", "0"))
        try:
            tariffs = get_customer_tariffs(token, cid)
        except Exception as e:
            return _json(502, {"error": str(e)})
        return _json(200, {
            "keys": sorted(tariffs[0].keys()) if tariffs else [],
            "items": tariffs,
        })

    return _json(400, {"error": "unknown mode"})


def handle_debug(token, params):
    """Разведка структуры: образцы уроков, диагностические уроки, абонемент, карточка."""
    date_from = params.get("date_from", "2024-01-01")
    date_to = params.get("date_to", date.today().strftime("%Y-%m-%d"))
    out = {}

    try:
        lessons = get_lessons(token, date_from, date_to, status=None)
    except Exception as e:
        lessons = []
        out["lessons_error"] = str(e)

    out["lessons_total"] = len(lessons)
    out["lesson_sample_keys"] = sorted(lessons[0].keys()) if lessons else []

    # Уроки, у которых тема/тип содержит "диагност".
    diag = []
    for ls in lessons:
        topic = (ls.get("topic") or "").lower()
        ltype = (ls.get("lesson_type_name") or "").lower()
        if "диагност" in topic or "диагност" in ltype:
            diag.append({
                "date": ls.get("date"),
                "topic": ls.get("topic"),
                "note": ls.get("note"),
                "lesson_type_name": ls.get("lesson_type_name"),
                "subject_id": ls.get("subject_id"),
                "customer_ids": ls.get("customer_ids"),
            })
    out["diag_lessons_count"] = len(diag)
    out["diag_lessons_sample"] = diag[:8]

    # Распределение по lesson_type_name (чтобы понять, как называется диагностика).
    types = {}
    for ls in lessons:
        t = ls.get("lesson_type_name")
        types[t] = types.get(t, 0) + 1
    out["lesson_types"] = types

    # Карточка одного ученика + его абонементы (только ключи и компактно).
    customers = get_all_customers(token)
    if customers:
        c = customers[0]
        out["customer_sample_keys"] = sorted(c.keys())
        out["customer_compact"] = {k: c.get(k) for k in
                                   ("id", "name", "dob", "b_date", "age", "balance",
                                    "paid_count", "next_lesson_date", "e_date",
                                    "study_status_id")}
        try:
            tariffs = get_customer_tariffs(token, c.get("id"))
            out["tariff_keys"] = sorted(tariffs[0].keys()) if tariffs else []
            out["customer_tariffs_sample"] = tariffs[:5]
        except Exception as e:
            out["customer_tariffs_error"] = str(e)

    return _json(200, out)