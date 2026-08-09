"""
Business: Динамика численности учеников — еженедельные срезы из CRM и график по неделям/месяцам/кварталам.
Args: event с httpMethod, queryStringParameters (mode, from, to, group)
Returns: JSON с точками графика или результатом сбора среза
"""

import json
import os
from datetime import date, datetime, timedelta
from typing import Any, Dict, List

import psycopg2
import requests

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"
SCHEMA = "t_p93118852_lineaschool_initiati"

# Статусы учеников в CRM
STATUS_ACTIVE = 1        # Активен
STATUS_FINISHED = 2      # Завершил
STATUS_DROPPED = 3       # Бросил
STATUS_FROZEN = 4        # Каникулы (заморожен)
STATUS_VACATION = 5      # Каникулы

STATUS_NAMES = {
    STATUS_ACTIVE: "Активен",
    STATUS_FINISHED: "Завершил",
    STATUS_DROPPED: "Бросил",
    STATUS_FROZEN: "Каникулы (заморожен)",
    STATUS_VACATION: "Каникулы",
}

# «Действующие» — все, кто ещё числится в школе: занимаются или на паузе.
# Бросившие и завершившие обучение сюда не входят.
ENROLLED_STATUSES = (STATUS_ACTIVE, STATUS_FROZEN, STATUS_VACATION)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
    "Access-Control-Max-Age": "86400",
}


def _json(status: int, body: dict) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False, default=str),
        "isBase64Encoded": False,
    }


def _conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def monday_of(d: date) -> date:
    """Понедельник той недели, в которую попадает дата."""
    return d - timedelta(days=d.weekday())


# ---------------------------------------------------------------- CRM


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
        headers=get_headers(),
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()["token"]


def fetch_customers(token, is_study=None, removed=None):
    url = f"{S20_HOST}/v2api/1/customer/index"
    out, page = [], 0
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
        out.extend(items)
        if len(out) >= data.get("total", 0) or not items:
            break
        page += 1
    return out


def get_all_customers(token):
    """Все ученики школы. Архивных помечаем — они считаются выбывшими."""
    seen, merged = set(), []
    for removed_flag in (0, 1):
        try:
            for it in fetch_customers(token, is_study=1, removed=removed_flag):
                cid = it.get("id")
                if cid in seen:
                    continue
                seen.add(cid)
                it["_archived"] = bool(removed_flag)
                merged.append(it)
        except Exception as e:
            print(f"customers fetch failed: {e}")
    return merged


def current_counts(token) -> Dict[str, Any]:
    """Текущий срез: сколько активных и сколько всего действующих."""
    customers = get_all_customers(token)
    breakdown: Dict[int, int] = {}
    for c in customers:
        # Архивный клиент = выбыл, независимо от статуса в карточке
        sid = STATUS_DROPPED if (c.get("_archived") or c.get("removed")) else c.get("study_status_id")
        try:
            sid = int(sid)
        except (TypeError, ValueError):
            continue
        breakdown[sid] = breakdown.get(sid, 0) + 1

    return {
        "active": breakdown.get(STATUS_ACTIVE, 0),
        "enrolled": sum(breakdown.get(s, 0) for s in ENROLLED_STATUSES),
        "breakdown": {STATUS_NAMES.get(k, str(k)): v for k, v in breakdown.items()},
        "total": len(customers),
    }


def fetch_lessons(token, date_from: str, date_to: str) -> List[dict]:
    """Проведённые занятия за период (status=3 — проведено)."""
    from concurrent.futures import ThreadPoolExecutor

    url = f"{S20_HOST}/v2api/1/lesson/index"
    page_size = 200

    def page(n):
        resp = requests.post(
            url,
            json={"date_from": date_from, "date_to": date_to,
                  "status": 3, "page": n, "pageSize": page_size},
            headers=get_headers(token),
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()

    first = page(0)
    items = list(first.get("items", []))
    total = first.get("total", 0)
    if not items or len(items) >= total:
        return items

    last_page = (total + page_size - 1) // page_size
    with ThreadPoolExecutor(max_workers=8) as ex:
        for data in ex.map(page, range(1, last_page)):
            items.extend(data.get("items", []))
    return items


def lesson_students(ls: dict) -> List[int]:
    """ID учеников занятия — CRM отдаёт их в разных полях."""
    for key in ("customer_ids", "client_ids", "student_ids"):
        v = ls.get(key)
        if isinstance(v, list) and v:
            return [x for x in v if isinstance(x, int)]
    details = ls.get("details")
    if isinstance(details, list):
        out = []
        for d in details:
            if isinstance(d, dict):
                cid = d.get("customer_id") or d.get("client_id")
                if isinstance(cid, int):
                    out.append(cid)
        return out
    return []


def lesson_date(ls: dict):
    for key in ("date", "lesson_date", "b_date"):
        v = ls.get(key)
        if not v:
            continue
        s = str(v)[:10]
        for fmt in ("%Y-%m-%d", "%d.%m.%Y"):
            try:
                return datetime.strptime(s, fmt).date()
            except ValueError:
                continue
    return None


# ---------------------------------------------------------------- сохранение


def save_snapshot(week: date, active: int, enrolled: int, breakdown: dict, source: str):
    """Записываем срез недели.

    Точный срез из CRM всегда важнее оценки по занятиям, поэтому
    восстановление задним числом не затирает уже снятые живые данные.
    """
    conn = _conn()
    cur = conn.cursor()
    if source == "lessons":
        conflict = """ON CONFLICT (week_start) DO UPDATE SET
                        active_count = EXCLUDED.active_count,
                        enrolled_count = EXCLUDED.enrolled_count,
                        source = EXCLUDED.source,
                        updated_at = NOW()
                      WHERE student_count_weekly.source <> 'crm'"""
    else:
        conflict = """ON CONFLICT (week_start) DO UPDATE SET
                        active_count = EXCLUDED.active_count,
                        enrolled_count = EXCLUDED.enrolled_count,
                        status_breakdown = EXCLUDED.status_breakdown,
                        source = EXCLUDED.source,
                        updated_at = NOW()"""
    cur.execute(
        f"""INSERT INTO {SCHEMA}.student_count_weekly
            (week_start, active_count, enrolled_count, status_breakdown, source)
            VALUES (%s, %s, %s, %s, %s) {conflict}""",
        (week, active, enrolled, json.dumps(breakdown, ensure_ascii=False), source),
    )
    conn.commit()
    cur.close()
    conn.close()


def handle_collect() -> Dict[str, Any]:
    """Снять срез за текущую неделю."""
    token = get_token()
    counts = current_counts(token)
    week = monday_of(date.today())
    save_snapshot(week, counts["active"], counts["enrolled"], counts["breakdown"], "crm")
    return _json(200, {
        "success": True,
        "week_start": str(week),
        "active": counts["active"],
        "enrolled": counts["enrolled"],
        "breakdown": counts["breakdown"],
    })


def fill_missing_weeks() -> Dict[str, Any]:
    """Достроить недели, за которые среза нет.

    Главная защита от пропусков: заходить в отчёт каждую неделю никто не
    обязан, а данные всё равно должны быть непрерывными. Занятия в CRM
    хранятся всегда, поэтому любую пропущенную неделю можно восстановить
    задним числом — независимо от того, открывал кто-то отчёт или нет.
    """
    conn = _conn()
    cur = conn.cursor()
    cur.execute(f"SELECT week_start FROM {SCHEMA}.student_count_weekly")
    have = {r[0] for r in cur.fetchall()}
    cur.close()
    conn.close()

    this_week = monday_of(date.today())
    if not have:
        return {"filled": 0, "weeks": []}

    # Ищем дыры между самой ранней записью и текущей неделей
    start = min(have)
    missing = []
    wk = start
    while wk <= this_week:
        if wk not in have:
            missing.append(wk)
        wk += timedelta(weeks=1)

    if not missing:
        return {"filled": 0, "weeks": []}

    # Тянем занятия одним запросом на весь пропущенный диапазон
    token = get_token()
    d_from = min(missing) - timedelta(weeks=8)
    lessons = fetch_lessons(token, str(d_from), str(this_week + timedelta(days=6)))

    by_week: Dict[date, set] = {}
    for ls in lessons:
        d = lesson_date(ls)
        if d:
            by_week.setdefault(monday_of(d), set()).update(lesson_students(ls))

    filled = []
    for wk in missing:
        students = by_week.get(wk, set())
        window = set()
        for i in range(8):
            window |= by_week.get(wk - timedelta(weeks=i), set())
        save_snapshot(wk, len(students), len(window), {}, "lessons")
        filled.append(str(wk))

    return {"filled": len(filled), "weeks": filled}


def handle_backfill(weeks_from: str, weeks_to: str) -> Dict[str, Any]:
    """Восстановить прошлые недели по занятиям.

    Точных статусов за прошлое CRM не хранит, поэтому считаем по факту:
    активные — у кого на той неделе были проведённые занятия;
    действующие — кто хоть раз занимался за последние 8 недель
    (ученик на каникулах пропадает из занятий, но из школы не уходит).
    """
    token = get_token()
    lessons = fetch_lessons(token, weeks_from, weeks_to)

    by_week: Dict[date, set] = {}
    for ls in lessons:
        d = lesson_date(ls)
        if not d:
            continue
        wk = monday_of(d)
        by_week.setdefault(wk, set()).update(lesson_students(ls))

    if not by_week:
        return _json(200, {"success": True, "weeks_saved": 0, "note": "занятий за период не найдено"})

    weeks = sorted(by_week)
    saved = 0
    for wk in weeks:
        active = len(by_week[wk])
        # Действующие: учились на этой неделе или в любую из 7 предыдущих
        window = {wk - timedelta(weeks=i) for i in range(8)}
        enrolled_ids = set()
        for w in window:
            enrolled_ids |= by_week.get(w, set())
        save_snapshot(wk, active, len(enrolled_ids), {}, "lessons")
        saved += 1

    return _json(200, {
        "success": True,
        "weeks_saved": saved,
        "first_week": str(weeks[0]),
        "last_week": str(weeks[-1]),
    })


# ---------------------------------------------------------------- чтение


def period_key(week: date, group: str) -> str:
    if group == "month":
        return f"{week.year}-{week.month:02d}"
    if group == "quarter":
        return f"{week.year}-Q{(week.month - 1) // 3 + 1}"
    return str(week)


def period_label(key: str, group: str) -> str:
    months = ["январь", "февраль", "март", "апрель", "май", "июнь",
              "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"]
    if group == "month":
        y, m = key.split("-")
        return f"{months[int(m) - 1]} {y}"
    if group == "quarter":
        y, q = key.split("-")
        return f"{q} {y}"
    d = datetime.strptime(key, "%Y-%m-%d").date()
    return d.strftime("%d.%m.%Y")


def handle_series(date_from: str, date_to: str, group: str) -> Dict[str, Any]:
    # Пропущенные недели восстанавливаем сами: отчётом пользуются редко,
    # и график не должен зиять дырами за месяцы, когда в него не заходили.
    try:
        filled = fill_missing_weeks()
        if filled["filled"]:
            print(f'Достроено недель: {filled["filled"]}')
    except Exception as e:
        print(f"fill_missing_weeks failed: {type(e).__name__}: {e}")

    conn = _conn()
    cur = conn.cursor()
    where, params = [], []
    if date_from:
        where.append("week_start >= %s")
        params.append(date_from)
    if date_to:
        where.append("week_start <= %s")
        params.append(date_to)
    sql = f"""SELECT week_start, active_count, enrolled_count, source, status_breakdown
              FROM {SCHEMA}.student_count_weekly"""
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY week_start"
    cur.execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return _json(200, {"points": [], "group": group, "stats": None})

    # Группируем: по неделям — как есть, по месяцам/кварталам — среднее
    buckets: Dict[str, Dict[str, Any]] = {}
    for week_start, active, enrolled, source, breakdown in rows:
        key = period_key(week_start, group)
        b = buckets.setdefault(key, {"active": [], "enrolled": [], "sources": set(),
                                     "weeks": 0, "breakdown": breakdown})
        b["active"].append(active)
        b["enrolled"].append(enrolled)
        b["sources"].add(source)
        b["weeks"] += 1
        if breakdown:
            b["breakdown"] = breakdown

    points = []
    for key in sorted(buckets):
        b = buckets[key]
        n = len(b["active"])
        points.append({
            "key": key,
            "label": period_label(key, group),
            # По месяцам и кварталам — среднее по неделям периода
            "active": round(sum(b["active"]) / n, 1) if group != "week" else b["active"][0],
            "enrolled": round(sum(b["enrolled"]) / n, 1) if group != "week" else b["enrolled"][0],
            "weeks": b["weeks"],
            # Точки, восстановленные по занятиям — приблизительные
            "estimated": "lessons" in b["sources"],
            "breakdown": b["breakdown"] or {},
        })

    # Планировщика в платформе нет, поэтому срез дособирается при открытии
    # отчёта: сообщаем, снят ли уже снимок за текущую неделю.
    this_week = monday_of(date.today())
    has_this_week = any(r[0] == this_week and r[3] == "crm" for r in rows)

    first, last = points[0], points[-1]
    stats = {
        "first_label": first["label"],
        "last_label": last["label"],
        "active_now": last["active"],
        "enrolled_now": last["enrolled"],
        "active_change": round(last["active"] - first["active"], 1),
        "enrolled_change": round(last["enrolled"] - first["enrolled"], 1),
        "active_max": max(p["active"] for p in points),
        "active_min": min(p["active"] for p in points),
        "periods": len(points),
        "weeks_total": len(rows),
    }
    return _json(200, {
        "points": points,
        "group": group,
        "stats": stats,
        "needs_snapshot": not has_this_week,
        "this_week": str(this_week),
    })


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Динамика численности учеников: сбор срезов и данные для графика."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": "", "isBase64Encoded": False}

    params = event.get("queryStringParameters") or {}
    mode = params.get("mode", "series")

    if method == "POST" or mode in ("collect", "backfill"):
        body = {}
        if event.get("body"):
            try:
                body = json.loads(event["body"])
            except json.JSONDecodeError:
                body = {}
        action = body.get("mode") or mode
        if action == "collect":
            return handle_collect()
        if action == "cron":
            # Точка для внешнего планировщика: снимает срез текущей недели
            # и заодно latает пропуски. Вызывать можно хоть каждый день —
            # повторный вызов в ту же неделю просто обновит запись.
            filled = fill_missing_weeks()
            res = handle_collect()
            payload = json.loads(res["body"])
            payload["filled_weeks"] = filled["filled"]
            res["body"] = json.dumps(payload, ensure_ascii=False)
            return res
        if action == "backfill":
            today = date.today()
            d_from = body.get("from") or params.get("from") or "2024-01-01"
            d_to = body.get("to") or params.get("to") or str(today)
            return handle_backfill(d_from, d_to)

    return handle_series(params.get("from", ""), params.get("to", ""), params.get("group", "week"))