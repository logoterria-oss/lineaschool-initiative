import os
import json
import re
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta, date

"""
Таблица учеников для кабинета администратора.
Источник: AlfaCRM S20 (статусы, занятия, абонементы) + БД заключений (speech_therapy_reports).

Диагностики берутся из CRM-уроков типа "Диагностика":
  topic = ссылка на заключение (https://lineaschool.ru/diag/{id}),
  note  = рекомендации, date = дата диагностики.
Заключение (типы дислексии/дисграфии/дизорфографии) и возраст — из speech_therapy_reports по id.
Абонемент — из customer-tariff (актуальный по e_date) + справочник tariff (название).

Режимы: GET ?mode=list | ?mode=statuses
"""

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"
SCHEMA = "t_p93118852_lineaschool_initiati"

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


def get_tariffs(token):
    """Справочник абонементов: id -> name."""
    url = f"{S20_HOST}/v2api/1/tariff/index"
    result = {}
    page = 0
    while True:
        try:
            resp = requests.post(url, json={"page": page, "pageSize": 200},
                                 headers=get_headers(token), timeout=20)
            if resp.status_code != 200:
                break
            data = resp.json()
            items = data.get("items", [])
            for t in items:
                result[t.get("id")] = t.get("name")
            if len(result) >= data.get("total", 0) or not items:
                break
            page += 1
        except Exception as e:
            print(f"tariff fetch failed: {e}")
            break
    return result


def get_customer_tariffs(token, customer_id):
    """Абонементы одного клиента (customer_id в query string)."""
    url = f"{S20_HOST}/v2api/1/customer-tariff/index?customer_id={customer_id}"
    try:
        resp = requests.post(url, json={"page": 0, "pageSize": 50},
                             headers=get_headers(token), timeout=15)
        if resp.status_code != 200:
            return []
        return resp.json().get("items", [])
    except Exception as e:
        print(f"customer-tariff failed {customer_id}: {e}")
        return []


def get_all_customer_tariffs(token, customer_ids):
    """Абонементы всех клиентов параллельно -> {customer_id: [items]}."""
    from concurrent.futures import ThreadPoolExecutor
    out = {}
    with ThreadPoolExecutor(max_workers=12) as ex:
        futures = {ex.submit(get_customer_tariffs, token, cid): cid
                   for cid in customer_ids}
        for f in futures:
            cid = futures[f]
            try:
                out[cid] = f.result()
            except Exception:
                out[cid] = []
    return out


def parse_crm_date(s):
    """CRM-даты бывают 'DD.MM.YYYY' или 'YYYY-MM-DD [HH:MM:SS]'."""
    if not s:
        return None
    s = s.strip()
    for fmt in ("%d.%m.%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:10], fmt).date()
        except ValueError:
            continue
    return None


def pick_actual_tariff(tariffs, tariff_names):
    """Актуальный абонемент: действует сейчас (e_date>=today), иначе последний по b_date."""
    if not tariffs:
        return None
    today = date.today()

    def label(t):
        name = tariff_names.get(t.get("tariff_id"), f"Абонемент #{t.get('tariff_id')}")
        return name

    actual = []
    for t in tariffs:
        e = parse_crm_date(t.get("e_date"))
        b = parse_crm_date(t.get("b_date"))
        actual.append((b or date.min, e, t))

    # сначала действующие
    live = [x for x in actual if x[1] is None or x[1] >= today]
    pool = live if live else actual
    pool.sort(key=lambda x: x[0], reverse=True)
    b, e, t = pool[0]
    is_live = bool(live) and (e is None or e >= today)
    return {
        "name": label(t),
        "e_date": str(e) if e else None,
        "is_active": is_live,
    }


def surname_first(name):
    """CRM хранит 'Имя Фамилия' -> возвращаем 'Фамилия Имя'.
    Имена сиблингов с союзом 'и' оставляем как есть."""
    name = (name or "").strip()
    if not name:
        return name
    parts = name.split()
    if "и" in [p.lower() for p in parts]:
        return name
    if len(parts) == 2:
        return f"{parts[1]} {parts[0]}"
    if len(parts) >= 3:
        return f"{parts[-1]} {' '.join(parts[:-1])}"
    return name


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
    """Предыдущая дата + 3 месяца чистого обучения. Недели без занятий не засчитываются.
    Ограничение: не дальше 6 календарных месяцев от предыдущей диагностики, чтобы
    при неполных данных по занятиям дата не уезжала на годы вперёд."""
    target_active_days = 90
    hard_limit = prev_date + timedelta(days=185)
    cur = prev_date
    active_days = 0
    while active_days < target_active_days and cur < hard_limit:
        cur = cur + timedelta(days=1)
        if iso_week_key(cur) in active_week_keys:
            active_days += 1
    return cur


def plain_plus_3_months(prev):
    m = prev.month - 1 + 3
    y = prev.year + m // 12
    mm = m % 12 + 1
    day = min(prev.day, 28)
    return date(y, mm, day)


def extract_report_id(topic):
    """Из темы урока достаём id заключения: .../diag/{id}."""
    if not topic:
        return None
    m = re.search(r"/diag/(\d+)", topic)
    return int(m.group(1)) if m else None


def load_reports(report_ids):
    """id -> {conclusion, age, link} из speech_therapy_reports."""
    if not report_ids:
        return {}
    ids = ",".join(str(int(i)) for i in report_ids)
    conn = db()
    out = {}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT id, student_age, form_data FROM {SCHEMA}.speech_therapy_reports "
            f"WHERE id IN ({ids})"
        )
        for r in cur.fetchall():
            conclusion = ""
            age = r.get("student_age")
            fd = r.get("form_data")
            if fd:
                try:
                    data = json.loads(fd)
                    parts = []
                    for key in ("dyslexiaTypes", "dysgraphiaTypes"):
                        val = data.get(key)
                        if isinstance(val, list):
                            parts.extend([str(x).strip() for x in val if str(x).strip()])
                        elif isinstance(val, str) and val.strip():
                            parts.append(val.strip())
                    conclusion = ", ".join(parts)
                    if not age:
                        a = data.get("age")
                        age = int(a) if str(a).isdigit() else age
                except Exception as e:
                    print(f"form_data parse failed for {r['id']}: {e}")
            out[r["id"]] = {"conclusion": conclusion, "age": age}
    conn.close()
    return out


def load_overrides():
    """Ручные правки: student_id -> {conclusion}."""
    conn = db()
    out = {}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"SELECT student_id, conclusion FROM {SCHEMA}.student_overrides")
        for r in cur.fetchall():
            out[r["student_id"]] = {"conclusion": r.get("conclusion")}
    conn.close()
    return out


def handle_save_override(body):
    student_id = body.get("student_id")
    if not student_id:
        return _json(400, {"error": "student_id required"})
    conclusion = body.get("conclusion")
    conclusion = conclusion.strip() if isinstance(conclusion, str) else None

    conn = db()
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.student_overrides (student_id, conclusion, updated_at) "
            f"VALUES (%s, %s, NOW()) "
            f"ON CONFLICT (student_id) DO UPDATE SET conclusion = EXCLUDED.conclusion, "
            f"updated_at = NOW()",
            (int(student_id), conclusion or None),
        )
        conn.commit()
    conn.close()
    return _json(200, {"success": True})


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


def handle_list(token):
    customers = get_all_customers(token)
    tariff_names = get_tariffs(token)
    tariffs_by_customer = get_all_customer_tariffs(token, [c.get("id") for c in customers])

    today = date.today()
    date_from = "2024-01-01"
    date_to = (today + timedelta(days=1)).strftime("%Y-%m-%d")

    # Все уроки за период (все статусы) — для диагностик и для расчёта активных недель.
    try:
        all_lessons = get_lessons(token, date_from, date_to, status=None)
    except Exception as e:
        print(f"lessons fetch failed: {e}")
        all_lessons = []

    # Диагностические уроки по ученику: {cid: {date, note, report_id}}.
    diag_by_student = {}
    active_weeks_by_student = {}
    for ls in all_lessons:
        ld = parse_crm_date(ls.get("date"))
        if not ld:
            continue
        ltype = (ls.get("lesson_type_name") or "").lower()
        cids = lesson_customer_ids(ls)

        # активные недели — по проведённым занятиям (status=3)
        if ls.get("status") == 3:
            wk = iso_week_key(ld)
            for cid in cids:
                active_weeks_by_student.setdefault(cid, set()).add(wk)

        if "диагност" in ltype:
            report_id = extract_report_id(ls.get("topic"))
            for cid in cids:
                prev = diag_by_student.get(cid)
                if prev is None or ld > prev["date"]:
                    diag_by_student[cid] = {
                        "date": ld,
                        "note": (ls.get("note") or "").strip(),
                        "report_id": report_id,
                    }

    # Заключения из БД для всех найденных report_id.
    report_ids = {d["report_id"] for d in diag_by_student.values() if d.get("report_id")}
    reports = load_reports(report_ids)
    overrides = load_overrides()

    items = []
    for c in customers:
        cid = c.get("id")
        status_id = c.get("study_status_id")
        diag = diag_by_student.get(cid)

        last_date = None
        next_date = None
        conclusion = ""
        age = None
        report_link = None
        recommendations = None

        if diag:
            last_date = diag["date"]
            recommendations = diag.get("note") or None
            rid = diag.get("report_id")
            if rid:
                report_link = f"https://lineaschool.ru/diag/{rid}"
                rep = reports.get(rid)
                if rep:
                    conclusion = rep.get("conclusion") or ""
                    age = rep.get("age")
            weeks = active_weeks_by_student.get(cid, set())
            if weeks:
                next_date = compute_next_diag(last_date, weeks)
            else:
                next_date = plain_plus_3_months(last_date)

        # Абонемент
        tariff = pick_actual_tariff(tariffs_by_customer.get(cid, []), tariff_names)

        # Ручная правка форм нарушений всегда в приоритете.
        ov = overrides.get(cid)
        conclusion_manual = False
        if ov and ov.get("conclusion") is not None:
            conclusion = ov["conclusion"]
            conclusion_manual = True

        items.append({
            "id": cid,
            "name": surname_first(c.get("name")),
            "status_id": status_id,
            "status_name": STATUS_NAMES.get(status_id, "—"),
            "age": age,
            "conclusion": conclusion,
            "conclusion_manual": conclusion_manual,
            "recommendations": recommendations,
            "last_diagnostic": str(last_date) if last_date else None,
            "next_diagnostic": str(next_date) if next_date else None,
            "report_link": report_link,
            "tariff": tariff,
        })

    items.sort(key=lambda x: (x.get("name") or "").lower())
    return _json(200, {"items": items})


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") == "POST":
        body = json.loads(event.get("body") or "{}")
        if body.get("action") == "save_override":
            return handle_save_override(body)
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

    return _json(400, {"error": "unknown mode"})