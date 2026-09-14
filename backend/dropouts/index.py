import os
import re
import json
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, date, timedelta
from concurrent.futures import ThreadPoolExecutor

"""
Раздел «Бросившие»: ученики, которые перестали заниматься.

По каждому считаем из CRM: ФИО, дату последнего занятия (дату ухода),
сколько месяцев занимался до этого, педагогов регулярных занятий
за последние 2 месяца обучения. Причину отказа и конфликты
администратор заполняет руками — они лежат в dropout_notes.
"""

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"
SCHEMA = "t_p93118852_lineaschool_initiati"

# Статусы обучения в CRM. «Бросил» — третий; архивные карточки
# тоже считаем ушедшими.
STATUS_DROPPED = 3
STATUS_NAMES = {1: "Активен", 2: "Завершил", 3: "Бросил",
                4: "Каникулы (заморожен)", 5: "Каникулы"}

# Сколько уроков за 2 месяца делают педагога регулярным, а не
# разовой подменой. Еженедельные занятия — это 6-8 уроков.
REGULAR_MIN_LESSONS = 3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}

_EMOJI_RE = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF\u2B00-\u2BFF\uFE0F]+"
)


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
    resp = requests.post(
        f"{S20_HOST}/v2api/auth/login",
        json={"email": S20_EMAIL, "api_key": os.environ["S20_API_KEY"]},
        headers=get_headers(), timeout=20,
    )
    resp.raise_for_status()
    return resp.json()["token"]


def parse_crm_date(s):
    """CRM-даты бывают 'DD.MM.YYYY' или 'YYYY-MM-DD [HH:MM:SS]'."""
    if not s:
        return None
    s = str(s).strip()
    for fmt in ("%d.%m.%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:10], fmt).date()
        except ValueError:
            continue
    return None


def surname_first(name):
    """CRM хранит «Имя Фамилия» — показываем «Фамилия Имя»."""
    src = (name or "").strip()
    text = re.sub(r"\s+", " ", _EMOJI_RE.sub("", src)).strip()
    if not text:
        return src
    parts = text.split()
    if "и" in [p.lower() for p in parts]:
        return text
    if len(parts) == 2:
        return f"{parts[1]} {parts[0]}"
    if len(parts) >= 3:
        return f"{parts[-1]} {' '.join(parts[:-1])}"
    return text


def _is_test_customer(name):
    """Технические карточки для проверок в списке не нужны."""
    s = (name or "").strip().lower().replace("ё", "е")
    if not s:
        return False
    if re.match(r"^(тест|test)(\b|[-_\s]|\d)", s):
        return True
    return bool(re.match(r"^тестов(ый|ая|ое|ые)\b", s))


def fetch_customers(token, is_study, removed):
    url = f"{S20_HOST}/v2api/1/customer/index"
    items, page = [], 0
    while True:
        resp = requests.post(
            url,
            json={"page": page, "pageSize": 200, "is_study": is_study, "removed": removed},
            headers=get_headers(token), timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        chunk = data.get("items", [])
        items.extend(chunk)
        if not chunk or len(items) >= data.get("total", 0):
            break
        page += 1
    return items


def get_all_customers(token):
    """Все карточки учеников, включая архивные."""
    seen, merged = set(), []
    for removed_flag in (0, 1):
        try:
            for it in fetch_customers(token, 1, removed_flag):
                cid = it.get("id")
                if cid in seen:
                    continue
                seen.add(cid)
                it["_archived"] = bool(removed_flag)
                merged.append(it)
        except Exception as e:
            print(f"customers fetch failed: {e}")
    return merged


def get_teachers(token):
    """Справочник педагогов: id -> имя."""
    url = f"{S20_HOST}/v2api/1/teacher/index"
    out, page = {}, 0
    while True:
        resp = requests.post(url, json={"page": page, "pageSize": 200},
                             headers=get_headers(token), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        for t in items:
            out[t.get("id")] = (t.get("name") or "").strip()
        if not items or len(out) >= data.get("total", 0):
            break
        page += 1
    return out


def get_lessons(token, date_from, date_to):
    """Занятия за период. Страниц много — тянем их параллельно."""
    url = f"{S20_HOST}/v2api/1/lesson/index"
    page_size = 200

    def fetch_page(page):
        resp = requests.post(
            url,
            json={"date_from": date_from, "date_to": date_to,
                  "page": page, "pageSize": page_size},
            headers=get_headers(token), timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

    first = fetch_page(0)
    items = first.get("items", [])
    total = first.get("total", 0)
    if not items or len(items) >= total:
        return items

    last_page = (total + page_size - 1) // page_size
    with ThreadPoolExecutor(max_workers=8) as ex:
        for data in ex.map(fetch_page, range(1, last_page)):
            items.extend(data.get("items", []))
    return items


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


def load_notes():
    """Причины ухода и конфликты, заполненные администратором."""
    out = {}
    conn = db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f"SELECT student_id, to_char(refused_at, 'YYYY-MM-DD') AS refused_at, "
                f"reason, conflicts, updated_by FROM {SCHEMA}.dropout_notes"
            )
            for r in cur.fetchall():
                out[r["student_id"]] = dict(r)
    finally:
        conn.close()
    return out


def months_between(start, end):
    """Сколько полных месяцев занимался: округляем до одного знака."""
    if not start or not end or end < start:
        return 0
    return round((end - start).days / 30.44, 1)


def handle_list():
    """Список бросивших из кеша — открывается мгновенно.

    Расчёт по CRM тяжёлый (вся история занятий с 2024 года), поэтому
    здесь только читаем готовые строки и подмешиваем свежие заметки.
    """
    notes = load_notes()
    conn = db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f"SELECT student_id, name, to_char(left_at, 'YYYY-MM-DD') AS left_at, "
                f"to_char(first_lesson, 'YYYY-MM-DD') AS first_lesson, months, teachers, "
                f"to_char(max(synced_at) OVER (), 'YYYY-MM-DD\"T\"HH24:MI:SS') AS synced_at "
                f"FROM {SCHEMA}.dropout_cache ORDER BY left_at DESC NULLS LAST, name"
            )
            cached = [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

    rows = []
    synced = cached[0]["synced_at"] if cached else None
    for c in cached:
        note = notes.get(c["student_id"], {})
        rows.append({
            "id": c["student_id"],
            "name": c["name"],
            # Дата последнего урока считается по CRM и руками не правится
            "left_at": c["left_at"],
            # Дата отказа — со слов родителя, её вводит администратор
            "refused_at": note.get("refused_at") or None,
            "first_lesson": c["first_lesson"],
            "months": float(c["months"] or 0),
            "teachers": c["teachers"] or [],
            "reason": note.get("reason") or "",
            "conflicts": note.get("conflicts") or "",
            "updated_by": note.get("updated_by") or "",
        })
    rows.sort(key=lambda r: r["left_at"] or "", reverse=True)
    return _json(200, {"ok": True, "students": rows, "count": len(rows),
                       "synced_at": synced})


def handle_sync(token):
    """Пересчитать данные по бросившим из CRM и сложить в кеш."""
    today = date.today()

    with ThreadPoolExecutor(max_workers=3) as ex:
        f_customers = ex.submit(get_all_customers, token)
        f_teachers = ex.submit(get_teachers, token)
        f_lessons = ex.submit(
            get_lessons, token, "2024-01-01",
            (today + timedelta(days=1)).strftime("%Y-%m-%d"),
        )
        customers = f_customers.result()
        teacher_names = f_teachers.result()
        lessons = f_lessons.result()

    # Занятия по ученику: первая и последняя дата, педагоги по датам
    first_by, last_by = {}, {}
    teach_by = {}   # cid -> [(дата, id педагога)]
    for ls in lessons:
        ld = parse_crm_date(ls.get("date"))
        if not ld or ls.get("status") in (2, 4):  # отменённые не считаем
            continue
        tids = [t for t in (ls.get("teacher_ids") or []) if t]
        for cid in lesson_customer_ids(ls):
            if cid not in first_by or ld < first_by[cid]:
                first_by[cid] = ld
            if cid not in last_by or ld > last_by[cid]:
                last_by[cid] = ld
            for tid in tids:
                teach_by.setdefault(cid, []).append((ld, tid))

    rows = []
    for c in customers:
        cid = c.get("id")
        name = (c.get("name") or "").strip()
        if not cid or _is_test_customer(name):
            continue

        status_id = STATUS_DROPPED if (c.get("_archived") or c.get("removed")) \
            else c.get("study_status_id")
        if status_id != STATUS_DROPPED:
            continue

        first = first_by.get(cid)
        # Дата последнего урока — только по занятиям в CRM
        left = last_by.get(cid)

        # Педагоги регулярных занятий за последние 2 месяца обучения.
        # Разовые подмены и диагностики не в счёт: постоянный педагог
        # ведёт ребёнка еженедельно, за 2 месяца это 6-8 уроков.
        recent = []
        if left:
            edge = left - timedelta(days=62)
            per_teacher = {}
            for ld, tid in teach_by.get(cid, []):
                if ld >= edge:
                    per_teacher[tid] = per_teacher.get(tid, 0) + 1

            ranked = sorted(per_teacher.items(), key=lambda kv: -kv[1])
            regular = [(tid, n) for tid, n in ranked if n >= REGULAR_MIN_LESSONS]
            # Занимался мало (ушёл быстро) — показываем основного педагога,
            # иначе строка осталась бы пустой
            if not regular and ranked:
                regular = ranked[:1]

            for tid, _ in regular:
                tname = teacher_names.get(tid)
                if tname:
                    recent.append(surname_first(tname))

        rows.append((cid, surname_first(name), left, first,
                     months_between(first, left), json.dumps(recent, ensure_ascii=False)))

    conn = db()
    try:
        with conn.cursor() as cur:
            # Кто вернулся к занятиям — из списка бросивших уходит
            cur.execute(f"TRUNCATE {SCHEMA}.dropout_cache")
            for r in rows:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.dropout_cache "
                    f"(student_id, name, left_at, first_lesson, months, teachers, synced_at) "
                    f"VALUES (%s, %s, %s, %s, %s, %s::jsonb, now())",
                    r,
                )
            conn.commit()
    finally:
        conn.close()

    return _json(200, {"ok": True, "synced": len(rows)})


def handle_save(event, body):
    """Сохранить дату отказа, причину и конфликты по ученику.

    Дата последнего урока сюда не попадает: её считает CRM.
    """
    student_id = body.get("student_id")
    if not student_id:
        return _json(400, {"error": "student_id required"})

    refused_at = str(body.get("refused_at") or "")[:10] or None
    conn = db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            author = _author(cur, event)
            cur.execute(
                f"INSERT INTO {SCHEMA}.dropout_notes "
                f"(student_id, student_name, refused_at, reason, conflicts, updated_by, updated_at) "
                f"VALUES (%s, %s, %s, %s, %s, %s, now()) "
                f"ON CONFLICT (student_id) DO UPDATE SET "
                f"student_name = EXCLUDED.student_name, refused_at = EXCLUDED.refused_at, "
                f"reason = EXCLUDED.reason, conflicts = EXCLUDED.conflicts, "
                f"updated_by = EXCLUDED.updated_by, updated_at = now() "
                f"RETURNING student_id, to_char(refused_at, 'YYYY-MM-DD') AS refused_at, "
                f"reason, conflicts, updated_by",
                (int(student_id), str(body.get("student_name") or "")[:255], refused_at,
                 str(body.get("reason") or ""), str(body.get("conflicts") or ""), author),
            )
            saved = dict(cur.fetchone())
            conn.commit()
        return _json(200, {"ok": True, **saved})
    finally:
        conn.close()


def _author(cur, event):
    """Кто правит запись — по токену админки."""
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    if not token:
        return ""
    cur.execute(
        "SELECT s.full_name FROM staff_sessions ss "
        "JOIN staff s ON s.id = ss.staff_id "
        "WHERE ss.token = %s AND ss.expires_at > now()",
        (token,),
    )
    row = cur.fetchone()
    return (row or {}).get("full_name") or ""


def handler(event: dict, context) -> dict:
    """Ученики, которые бросили занятия: список с причинами ухода и педагогами"""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        params = event.get("queryStringParameters") or {}
        if method == "GET":
            # Пересчёт по CRM — отдельным действием: он долгий
            if str(params.get("action") or "") == "sync":
                return handle_sync(get_token())
            return handle_list()
        if method == "POST":
            return handle_save(event, json.loads(event.get("body") or "{}"))
        return _json(405, {"error": "Method not allowed"})
    except Exception as e:
        print(f"dropouts failed: {e}")
        return _json(500, {"error": str(e)})