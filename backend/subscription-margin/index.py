import os
import re
import json
import requests
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor

"""
Маржинальность абонементов.

Что делает функция:
  1. отдаёт справочник абонементов из AlfaCRM (действующие + архивные);
  2. собирает фактический срез месяца: сколько занятий проведено по каждому
     абонементу, какими педагогами, какого размера были группы и сколько
     денег списано — это основа расчёта прямых расходов;
  3. хранит сами отчёты (вход + результат), чтобы их можно было править
     после сохранения и строить динамику по датам сохранения.

Почему уроки считаем «ученико-уроками». В CRM у проведённого занятия
(status=3) в details лежит строка на каждого ребёнка со списанной суммой
(commission). Одно групповое занятие — это один час работы педагога, но
несколько списаний. Чтобы понять, сколько стоит абонемент ОДНОГО ребёнка,
час группового занятия делим на число детей в группе: именно такую долю
зарплаты педагога «съедает» этот абонемент.

Маршруты:
  GET  ?action=tariffs                  — справочник абонементов CRM
  GET  ?action=crm&month=YYYY-MM        — факт месяца (&refresh=1 — мимо кэша)
  GET  ?action=reports                  — сохранённые отчёты
  GET  ?action=defaults                 — пресет косвенных расходов
  POST {action: save|update|delete|save_defaults}
"""

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-User-Id",
    "Access-Control-Max-Age": "86400",
}


def _json(payload, code=200):
    return {
        "statusCode": code,
        "headers": CORS,
        "body": json.dumps(payload, ensure_ascii=False, default=str),
        "isBase64Encoded": False,
    }


# ---------- CRM ----------

def _headers(token=None):
    h = {
        "X-APP-KEY": os.environ["S20_X_APP_KEY"],
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if token:
        h["X-ALFACRM-TOKEN"] = token
    return h


def _token():
    r = requests.post(
        f"{S20_HOST}/v2api/auth/login",
        json={"email": S20_EMAIL, "api_key": os.environ["S20_API_KEY"]},
        headers=_headers(), timeout=20,
    )
    r.raise_for_status()
    return r.json()["token"]


def _index(path, token, payload=None, timeout=30):
    """Постраничный обход любого справочника CRM."""
    out, page = [], 0
    while True:
        body = dict(payload or {})
        body.update({"page": page, "pageSize": 200})
        r = requests.post(f"{S20_HOST}{path}", json=body,
                          headers=_headers(token), timeout=timeout)
        if r.status_code != 200:
            break
        data = r.json()
        items = data.get("items", [])
        out.extend(items)
        if not items or len(out) >= data.get("total", 0):
            break
        page += 1
    return out


def _fetch_tariffs(token):
    """Справочник абонементов: и действующие, и архивные."""
    out = {}
    for t in _index("/v2api/1/tariff/index", token):
        tid = t.get("id")
        if tid is None:
            continue
        out[tid] = {
            "id": tid,
            "name": (t.get("name") or "").strip(),
            "price": _to_float(t.get("price")),
            "lessons_count": _to_float(t.get("lessons_count")),
            "is_active": bool(t.get("is_active", 1)),
        }
    return out


def _fetch_teachers(token):
    out = {}
    for t in _index("/v2api/1/teacher/index", token):
        out[t.get("id")] = (t.get("name") or "").strip()
    return out


def _fetch_lessons(token, date_from, date_to, status=3):
    """Проведённые занятия за период. Страниц много — тянем параллельно."""
    url = f"{S20_HOST}/v2api/1/lesson/index"
    size = 200

    def page(p):
        body = {"date_from": date_from, "date_to": date_to,
                "page": p, "pageSize": size}
        if status is not None:
            body["status"] = status
        r = requests.post(url, json=body, headers=_headers(token), timeout=40)
        r.raise_for_status()
        return r.json()

    first = page(0)
    items = first.get("items", [])
    total = first.get("total", 0)
    if not items or len(items) >= total:
        return items
    last = (total + size - 1) // size
    with ThreadPoolExecutor(max_workers=8) as ex:
        for data in ex.map(page, range(1, last)):
            items.extend(data.get("items", []))
    return items


def _fetch_customer_tariffs(token, customer_ids):
    """Абонементы клиентов с периодами действия: {cid: [ {tariff_id, b, e} ]}."""
    def one(cid):
        items = []
        page = 0
        while True:
            try:
                r = requests.post(
                    f"{S20_HOST}/v2api/1/customer-tariff/index?customer_id={cid}",
                    json={"page": page, "pageSize": 100},
                    headers=_headers(token), timeout=15)
                if r.status_code != 200:
                    print(f"customer-tariff {cid} -> HTTP {r.status_code}")
                    break
                data = r.json()
                chunk = data.get("items", [])
                items.extend(chunk)
                if not chunk or len(items) >= data.get("total", 0):
                    break
                page += 1
            except Exception:
                break
        return items

    out = {}
    with ThreadPoolExecutor(max_workers=12) as ex:
        futures = {ex.submit(one, cid): cid for cid in customer_ids}
        for f in futures:
            cid = futures[f]
            try:
                out[cid] = f.result()
            except Exception:
                out[cid] = []
    return out


# ---------- мелкие помощники ----------

def _to_float(v):
    try:
        return float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return 0.0


def _parse_date(v):
    """Дата из CRM. В одном ответе встречаются оба формата: абонементы
    отдают «07.11.2025», занятия — «2026-08-14», поэтому разбираем оба.
    """
    s = str(v or "").strip()[:10]
    if not s:
        return None
    try:
        return date.fromisoformat(s)
    except ValueError:
        pass
    m = re.fullmatch(r"(\d{2})\.(\d{2})\.(\d{4})", s)
    if m:
        d, mo, y = (int(x) for x in m.groups())
        try:
            return date(y, mo, d)
        except ValueError:
            return None
    return None


def _month_bounds(month):
    y, m = int(month[:4]), int(month[5:7])
    first = date(y, m, 1)
    last = date(y + (m == 12), (m % 12) + 1, 1) - timedelta(days=1)
    return first, last


def per_week(name):
    """Уроков в неделю. В CRM три написания названия сразу:
    «2 урока в неделю», «"2 ур./нед."» и просто «3 месяца» (старьё без числа).
    """
    n = str(name or "")
    m = re.search(r"(\d+)\s*урок\w*\s+в\s+недел", n, re.I)
    if m:
        return int(m.group(1))
    m = re.search(r"(\d+)\s*ур\.?\s*/?\s*нед", n, re.I)
    return int(m.group(1)) if m else None


def months_in(name):
    m = re.search(r"(\d+)\s*месяц", str(name or ""), re.I)
    return int(m.group(1)) if m else None


def composition(name):
    """Состав абонемента из названия: сколько групповых и индивидуальных
    в неделю. Новая линейка пишет его прямо в скобках — «(2гр.+1инд.)»,
    «(групповые)», «"индивидуальный"». Для старых названий возвращаем None
    и дальше опираемся на факт из CRM.
    """
    n = str(name or "")
    m = re.search(r"(\d+)\s*гр\w*\.?\s*\+\s*(\d+)\s*инд", n, re.I)
    if m:
        return {"group": int(m.group(1)), "individual": int(m.group(2))}
    pw = per_week(n)
    if re.search(r"\(групповые\)", n, re.I) and pw:
        return {"group": pw, "individual": 0}
    if re.search(r"индивидуальн", n, re.I):
        return {"group": 0, "individual": pw or 0}
    return None


def is_archived(name):
    """«Архивный» — часть НАЗВАНИЯ тарифа, а не истёкшая дата.

    По старой линейке («АРХИВНЫЙ Абонемент …») учится часть детей прямо
    сейчас, поэтому в выпадающем списке такие абонементы нужны наравне
    с новыми — просто с пометкой.
    """
    return bool(re.search(r"архивн", str(name or ""), re.I))


def short_name(name):
    """«Абонемент "4 урока в неделю" (3 месяца)» → «4 ур/нед (3 мес.)»."""
    if not name:
        return ""
    n = re.sub(r"архивн\w*\s*", "", str(name), flags=re.I)
    p, mo = per_week(n), months_in(n)
    comp = composition(n)
    parts = []
    if p:
        parts.append(f"{p} ур/нед")
    elif comp and (comp["group"] + comp["individual"]):
        parts.append(f"{comp['group'] + comp['individual']} ур/нед")
    if comp:
        parts.append(f"[{comp['group']}гр+{comp['individual']}инд]")
    if mo:
        parts.append(f"({mo} мес.)")
    if parts:
        return " ".join(parts)
    return re.sub(r"^Абонемент\s*", "", n).strip(' "«»')


# ---------- факт месяца ----------

def _build_month(token, month):
    """Срез месяца: занятия, педагоги и деньги в разрезе абонементов."""
    d_from, d_to = _month_bounds(month)
    lessons = _fetch_lessons(token, d_from.isoformat(), d_to.isoformat(), status=3)
    teachers = _fetch_teachers(token)

    # Ученики, у которых в этом месяце были занятия — только по ним
    # спрашиваем абонементы, иначе ушли бы сотни лишних запросов.
    cids = set()
    for ls in lessons:
        for d in ls.get("details") or []:
            if isinstance(d, dict) and d.get("customer_id") is not None:
                cids.add(d["customer_id"])

    ct = _fetch_customer_tariffs(token, sorted(cids))
    tariff_dict = _fetch_tariffs(token)

    def tariff_on(cid, day):
        """Какой абонемент действовал у ребёнка в день занятия.

        Занятие списывается с того абонемента, чей период покрывает дату.
        Если подходящих нет (абонемент кончился, занимаются «в долг») —
        берём ближайший предыдущий: фактически ребёнок учится по нему.
        """
        best, best_gap = None, None
        for t in ct.get(cid) or []:
            b = _parse_date(t.get("b_date"))
            e = _parse_date(t.get("e_date"))
            tid = t.get("tariff_id")
            if tid is None:
                continue
            if b and e and b <= day <= e:
                return tid
            ref = e or b
            if ref is None:
                continue
            gap = abs((day - ref).days)
            if best_gap is None or gap < best_gap:
                best, best_gap = tid, gap
        return best

    agg = {}
    total_revenue = 0.0
    total_student_lessons = 0
    total_lessons = 0
    diag_lessons = 0
    students_all = set()

    for ls in lessons:
        day = _parse_date(ls.get("date")) or d_from
        details = [d for d in (ls.get("details") or []) if isinstance(d, dict)]
        if not details:
            continue
        is_diag = "диагност" in (ls.get("lesson_type_name") or "").lower()
        # lesson_type_id: 1 — индивидуальное, 2 — групповое.
        form = "individual" if ls.get("lesson_type_id") == 1 else "group"
        group_size = max(1, len(details))
        tids = [t for t in (ls.get("teacher_ids") or []) if t]
        teacher_id = tids[0] if tids else None
        total_lessons += 1
        if is_diag:
            diag_lessons += 1

        for d in details:
            cid = d.get("customer_id")
            if cid is None:
                continue
            price = _to_float(d.get("commission"))
            students_all.add(cid)
            total_student_lessons += 1
            total_revenue += price
            if is_diag:
                continue

            tid = tariff_on(cid, day)
            if tid is None:
                continue
            key = str(tid)
            slot = agg.setdefault(key, {
                "tariff_id": tid,
                "students": [],
                "group_student_lessons": 0,
                "individual_student_lessons": 0,
                "revenue": 0.0,
                "group_size_sum": 0,
                "group_size_n": 0,
                "by_teacher": {},
            })
            if cid not in slot["students"]:
                slot["students"].append(cid)
            slot["revenue"] += price
            slot[f"{form}_student_lessons"] += 1
            if form == "group":
                slot["group_size_sum"] += group_size
                slot["group_size_n"] += 1
            if teacher_id is not None:
                t = slot["by_teacher"].setdefault(str(teacher_id), {
                    "name": teachers.get(teacher_id) or f"#{teacher_id}",
                    "group": 0, "individual": 0,
                    "group_size_sum": 0, "group_size_n": 0,
                })
                t[form] += 1
                if form == "group":
                    t["group_size_sum"] += group_size
                    t["group_size_n"] += 1

    tariffs = {}
    for key, slot in agg.items():
        info = tariff_dict.get(slot["tariff_id"]) or {}
        name = info.get("name") or f"Абонемент #{slot['tariff_id']}"
        lessons_count = info.get("lessons_count") or 0
        price = info.get("price") or 0
        tariffs[key] = {
            "tariff_id": slot["tariff_id"],
            "name": name,
            "short_name": short_name(name),
            "is_archived": is_archived(name),
            "price": price,
            "lessons_count": lessons_count,
            "price_per_lesson": round(price / lessons_count, 2) if lessons_count else 0,
            "per_week": per_week(name),
            "months": months_in(name),
            "composition": composition(name),
            "students": len(slot["students"]),
            "group_student_lessons": slot["group_student_lessons"],
            "individual_student_lessons": slot["individual_student_lessons"],
            "student_lessons": slot["group_student_lessons"] + slot["individual_student_lessons"],
            "revenue": round(slot["revenue"], 2),
            "avg_group_size": round(slot["group_size_sum"] / slot["group_size_n"], 2)
                              if slot["group_size_n"] else 0,
            "teachers": sorted(
                [
                    {
                        "teacher_id": int(tid),
                        "name": t["name"],
                        "group": t["group"],
                        "individual": t["individual"],
                        "avg_group_size": round(t["group_size_sum"] / t["group_size_n"], 2)
                                          if t["group_size_n"] else 0,
                    }
                    for tid, t in slot["by_teacher"].items()
                ],
                key=lambda x: -(x["group"] + x["individual"]),
            ),
        }

    return {
        "month": month,
        "total_revenue": round(total_revenue, 2),
        "total_student_lessons": total_student_lessons,
        "total_lessons": total_lessons,
        "diag_lessons": diag_lessons,
        "students_total": len(students_all),
        "tariffs": tariffs,
    }


# ---------- БД ----------

def _conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], connect_timeout=10)


def _cache_read(conn, month):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT payload FROM {SCHEMA}.margin_crm_cache WHERE month = %s",
            (month,))
        row = cur.fetchone()
    return row[0] if row else None


def _cache_write(conn, month, payload):
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.margin_crm_cache (month, payload) "
            f"VALUES (%s, %s) ON CONFLICT (month) DO UPDATE SET "
            f"payload = EXCLUDED.payload, computed_at = now()",
            (month, Json(payload)))
    conn.commit()


def _reports(conn, limit=200):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"""
            SELECT id, title, tariff_key, tariff_name, period_month,
                   inputs, result, note, author, created_at, updated_at
            FROM {SCHEMA}.margin_reports
            ORDER BY period_month DESC, created_at DESC
            LIMIT %s
        """, (limit,))
        return cur.fetchall()


def handler(event: dict, context) -> dict:
    """Отчёт «Маржинальность абонементов»: данные CRM и хранение отчётов."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": "", "isBase64Encoded": False}

    params = event.get("queryStringParameters") or {}
    action = (params.get("action") or "").strip()

    try:
        if method == "GET":
            if action == "tariffs":
                token = _token()
                items = []
                for t in _fetch_tariffs(token).values():
                    name = t["name"]
                    lc = t["lessons_count"] or 0
                    items.append({
                        **t,
                        "short_name": short_name(name),
                        "is_archived": is_archived(name),
                        "per_week": per_week(name),
                        "months": months_in(name),
                        "composition": composition(name),
                        "price_per_lesson": round(t["price"] / lc, 2) if lc else 0,
                    })
                items.sort(key=lambda x: (x["is_archived"], x["per_week"] or 99,
                                          x["months"] or 99, x["name"]))
                return _json({"success": True, "tariffs": items})

            if action == "crm":
                month = (params.get("month") or "").strip()
                if not re.fullmatch(r"\d{4}-\d{2}", month):
                    return _json({"success": False, "error": "month=YYYY-MM обязателен"}, 400)
                conn = _conn()
                try:
                    if params.get("refresh") != "1":
                        cached = _cache_read(conn, month)
                        if cached:
                            return _json({"success": True, "data": cached, "cached": True})
                    data = _build_month(_token(), month)
                    _cache_write(conn, month, data)
                    return _json({"success": True, "data": data, "cached": False})
                finally:
                    conn.close()

            if action == "reports":
                conn = _conn()
                try:
                    return _json({"success": True, "reports": _reports(conn)})
                finally:
                    conn.close()

            if action == "defaults":
                conn = _conn()
                try:
                    with conn.cursor() as cur:
                        cur.execute(
                            f"SELECT payload FROM {SCHEMA}.margin_defaults WHERE id = 1")
                        row = cur.fetchone()
                    return _json({"success": True, "defaults": row[0] if row else None})
                finally:
                    conn.close()

            return _json({"success": False, "error": "Неизвестное действие"}, 400)

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            act = (body.get("action") or "").strip()
            conn = _conn()
            try:
                if act == "save":
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute(f"""
                            INSERT INTO {SCHEMA}.margin_reports
                                (title, tariff_key, tariff_name, period_month,
                                 inputs, result, note, author)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            RETURNING id, title, tariff_key, tariff_name, period_month,
                                      inputs, result, note, author, created_at, updated_at
                        """, (
                            (body.get("title") or "").strip()[:255],
                            (body.get("tariff_key") or "").strip()[:255],
                            (body.get("tariff_name") or "").strip()[:500],
                            (body.get("period_month") or "").strip()[:7],
                            Json(body.get("inputs") or {}),
                            Json(body.get("result") or {}),
                            (body.get("note") or "").strip(),
                            (body.get("author") or "").strip()[:255],
                        ))
                        row = cur.fetchone()
                    conn.commit()
                    return _json({"success": True, "report": row})

                if act == "update":
                    rid = body.get("id")
                    if not rid:
                        return _json({"success": False, "error": "id обязателен"}, 400)
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute(f"""
                            UPDATE {SCHEMA}.margin_reports SET
                                title = %s, tariff_key = %s, tariff_name = %s,
                                period_month = %s, inputs = %s, result = %s,
                                note = %s, updated_at = now()
                            WHERE id = %s
                            RETURNING id, title, tariff_key, tariff_name, period_month,
                                      inputs, result, note, author, created_at, updated_at
                        """, (
                            (body.get("title") or "").strip()[:255],
                            (body.get("tariff_key") or "").strip()[:255],
                            (body.get("tariff_name") or "").strip()[:500],
                            (body.get("period_month") or "").strip()[:7],
                            Json(body.get("inputs") or {}),
                            Json(body.get("result") or {}),
                            (body.get("note") or "").strip(),
                            int(rid),
                        ))
                        row = cur.fetchone()
                    conn.commit()
                    if not row:
                        return _json({"success": False, "error": "Отчёт не найден"}, 404)
                    return _json({"success": True, "report": row})

                if act == "delete":
                    rid = body.get("id")
                    if not rid:
                        return _json({"success": False, "error": "id обязателен"}, 400)
                    with conn.cursor() as cur:
                        cur.execute(
                            f"DELETE FROM {SCHEMA}.margin_reports WHERE id = %s",
                            (int(rid),))
                    conn.commit()
                    return _json({"success": True})

                if act == "save_defaults":
                    with conn.cursor() as cur:
                        cur.execute(f"""
                            INSERT INTO {SCHEMA}.margin_defaults (id, payload, updated_at)
                            VALUES (1, %s, now())
                            ON CONFLICT (id) DO UPDATE SET
                                payload = EXCLUDED.payload, updated_at = now()
                        """, (Json(body.get("defaults") or {}),))
                    conn.commit()
                    return _json({"success": True})

                return _json({"success": False, "error": "Неизвестное действие"}, 400)
            finally:
                conn.close()

        return _json({"success": False, "error": "Метод не поддерживается"}, 405)

    except Exception as e:
        print(f"subscription-margin failed: {e}")
        return _json({"success": False, "error": str(e)}, 500)