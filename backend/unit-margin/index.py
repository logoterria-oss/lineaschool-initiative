import os
import re
import json
import requests
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor

"""
Маржинальность одного УРОКА (юнит-экономика без абонементов).

Зачем отдельно от абонементов. У детей одновременно живут действующие,
архивные и совсем доисторические абонементы, поэтому считать экономику
«на абонемент» бессмысленно: сравнивать нечего. Единый юнит, который
одинаково устроен в любом месяце, — ОДИН ПРОВЕДЁННЫЙ УРОК.

Что считаем:
  • средняя цена индивидуального урока — сколько в среднем списано с
    ребёнка за индивидуальное занятие в этом месяце;
  • средняя цена группового урока НА ОДНОГО ЧЕЛОВЕКА — то же самое, но
    по групповым занятиям: в одном занятии несколько списаний, каждое
    списание и есть юнит.

Источник — проведённые занятия (status=3) в AlfaCRM за месяц. В details
каждого занятия лежит строка на каждого ребёнка со списанной суммой
(commission). Диагностики исключаем: это разовая услуга с другой ценой
и другой экономикой, она исказит среднюю. Технические карточки
(«Тест-ученик-1») тоже выкидываем — это не работа школы.

Постоянные (косвенные) расходы школы здесь НЕ участвуют — маржинальность
по определению считается только на переменных затратах.

Маршруты:
  GET  ?action=fact&month=YYYY-MM   — факт месяца (&refresh=1 — мимо кэша)
  GET  ?action=defaults             — сохранённые ставки и проценты
  GET  ?action=reports              — сохранённые расчёты
  POST {action: save|delete|save_defaults}
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


def _fetch_teachers(token):
    out, page = {}, 0
    while True:
        r = requests.post(f"{S20_HOST}/v2api/1/teacher/index",
                          json={"page": page, "pageSize": 200},
                          headers=_headers(token), timeout=30)
        if r.status_code != 200:
            break
        data = r.json()
        items = data.get("items", [])
        for t in items:
            out[t.get("id")] = (t.get("name") or "").strip()
        if not items or len(out) >= data.get("total", 0):
            break
        page += 1
    return out


def _test_customer_ids(conn):
    """id технических карточек CRM («Тест-ученик-1», «Юля Тест-ученик-2»).

    Имена берём из локального кэша клиентов, а не из CRM: обход всех
    карточек по API занимает десятки секунд и упирается в таймаут функции.
    Кэш обновляет отдельная функция crm-sync-cache.
    """
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, name FROM {SCHEMA}.crm_customers_cache")
        rows = cur.fetchall()
    return {cid for cid, name in rows if _is_test_customer(name)}


def _is_test_customer(name):
    """Техническая карточка для проверок — в экономику не берём.

    Такие записи заводят в CRM для тестов, их занятия — не настоящая работа
    школы: они искажают и среднюю цену, и наполняемость.

    Ищем слово «тест» В ЛЮБОМ месте имени, а не только в начале: в CRM
    встречаются и «Тест-ученик-1», и «Юля Тест-ученик-2», и «тест Абраменко
    Виктория». При этом смотрим именно на ОТДЕЛЬНОЕ слово — настоящие
    фамилии вроде «Тестова Мария» или «Протестов» не трогаем.
    """
    s = (name or "").strip().lower().replace("ё", "е")
    if not s:
        return False
    # «тест», «тест-ученик-1», «test», «тестовый/тестовая/тестовое»
    return bool(re.search(r"(?<![а-яa-z])(тест|test)(ов(ый|ая|ое|ые))?(?![а-яa-z])", s))


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


# ---------- помощники ----------

def _to_float(v):
    try:
        return float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return 0.0


def _month_bounds(month):
    y, m = int(month[:4]), int(month[5:7])
    first = date(y, m, 1)
    last = date(y + (m == 12), (m % 12) + 1, 1) - timedelta(days=1)
    return first, last


def _r2(v):
    return round(v + 0.0, 2)


# ---------- факт месяца ----------

def _build_month(token, month, test_ids=frozenset()):
    """Срез месяца: уроки, списания и педагоги в разрезе формы занятия.

    Юнит — ОДНО ПРОВЕДЁННОЕ ЗАНЯТИЕ целиком.

    Про пропуски. В details каждого занятия лежит строка на каждого ребёнка:
      is_attend  — был ли на занятии (0 — не был);
      commission — сколько списано с его баланса.
    Списание за прогул делает сама CRM по правилам школы: пропуск без
    уважительной причины оплачивается (commission > 0 при is_attend = 0),
    с уважительной — нет (commission = 0). Правило одинаково для групповых
    и индивидуальных занятий.

    Для экономики важно именно СПИСАНИЕ, а не присутствие: оплаченный
    прогул приносит деньги, а бесплатная отработка — нет. Поэтому выручку
    занятия считаем по числу ОПЛАЧЕННЫХ мест, а присутствие показываем
    отдельно — чтобы было видно, какая часть выручки пришла с прогулов.
    """
    d_from, d_to = _month_bounds(month)
    lessons = _fetch_lessons(token, d_from.isoformat(), d_to.isoformat(), status=3)
    teachers = _fetch_teachers(token)

    # Технические карточки («Тест-ученик-1») — не настоящая работа школы.
    # Их места не считаем ни в выручке, ни в наполняемости.
    skipped_test_units = 0
    skipped_test_lessons = 0

    def _side():
        return {
            "lessons": 0, "units": 0, "revenue": 0.0,
            "paid_units": 0, "free_units": 0, "students": set(),
            "size_sum": 0, "size_n": 0,
            # Пропуски: списанные (неуважительные) и бесплатные (уважительные)
            "attended_units": 0, "missed_units": 0,
            "missed_charged": 0, "missed_charged_revenue": 0.0,
            "missed_free": 0,
        }

    forms = {"individual": _side(), "group": _side()}
    by_teacher = {}
    diag_lessons = 0
    skipped_no_details = 0

    for ls in lessons:
        details = [d for d in (ls.get("details") or []) if isinstance(d, dict)]
        if not details:
            skipped_no_details += 1
            continue
        # Диагностика — разовая услуга с отдельной ценой, в среднюю не берём.
        if "диагност" in (ls.get("lesson_type_name") or "").lower():
            diag_lessons += 1
            continue

        # Выкидываем места тестовых учеников. Если после этого на занятии
        # никого не осталось — это тестовое занятие целиком, пропускаем его:
        # иначе в знаменатель наполняемости попал бы пустой урок.
        real = [d for d in details if d.get("customer_id") not in test_ids]
        if len(real) != len(details):
            skipped_test_units += len(details) - len(real)
        if not real:
            skipped_test_lessons += 1
            continue
        details = real

        # lesson_type_id: 1 — индивидуальное, 2 — групповое.
        form = "individual" if ls.get("lesson_type_id") == 1 else "group"
        slot = forms[form]
        group_size = len(details)

        slot["lessons"] += 1
        # Физическое число записанных на занятие — справочно, для сверки
        # с оплаченной наполняемостью.
        slot["size_sum"] += group_size
        slot["size_n"] += 1

        tids = [t for t in (ls.get("teacher_ids") or []) if t]
        teacher_id = tids[0] if tids else None
        if teacher_id is not None:
            t = by_teacher.setdefault(str(teacher_id), {
                "teacher_id": teacher_id,
                "name": teachers.get(teacher_id) or f"#{teacher_id}",
                "group_lessons": 0, "group_units": 0, "group_paid_units": 0,
                "group_revenue": 0.0,
                "individual_lessons": 0, "individual_units": 0,
                "individual_paid_units": 0, "individual_revenue": 0.0,
            })
            t[f"{form}_lessons"] += 1
        else:
            t = None

        for d in details:
            cid = d.get("customer_id")
            if cid is None:
                continue
            price = _to_float(d.get("commission"))
            # is_attend: 0 — ребёнка на занятии не было. Списание за такой
            # пропуск (commission > 0) CRM делает по правилам школы.
            attended = d.get("is_attend") != 0
            slot["units"] += 1
            slot["revenue"] += price
            slot["students"].add(cid)
            if price > 0:
                slot["paid_units"] += 1
            else:
                slot["free_units"] += 1
            if attended:
                slot["attended_units"] += 1
            else:
                slot["missed_units"] += 1
                if price > 0:
                    slot["missed_charged"] += 1
                    slot["missed_charged_revenue"] += price
                else:
                    slot["missed_free"] += 1
            if t is not None:
                t[f"{form}_units"] += 1
                t[f"{form}_revenue"] += price
                if price > 0:
                    t[f"{form}_paid_units"] += 1

    def pack(form):
        s = forms[form]
        out = {
            "lessons": s["lessons"],
            "units": s["units"],
            "paid_units": s["paid_units"],
            "free_units": s["free_units"],
            "students": len(s["students"]),
            "revenue": _r2(s["revenue"]),
            # Средняя цена ОПЛАЧЕННОГО места: сколько платит один ребёнок.
            # Делим на платные списания, а бесплатные (отработки, уважительные
            # пропуски) учитываем отдельно — через наполняемость.
            "avg_price": _r2(s["revenue"] / s["paid_units"]) if s["paid_units"] else 0,
            # Сколько денег приносит одно занятие по факту.
            "revenue_per_lesson": _r2(s["revenue"] / s["lessons"]) if s["lessons"] else 0,
            # Посещаемость и пропуски.
            "attended_units": s["attended_units"],
            "missed_units": s["missed_units"],
            "missed_charged": s["missed_charged"],
            "missed_charged_revenue": _r2(s["missed_charged_revenue"]),
            "missed_free": s["missed_free"],
            # Доля выручки, пришедшая со списанных прогулов.
            "missed_revenue_share": (
                _r2(s["missed_charged_revenue"] / s["revenue"] * 100) if s["revenue"] else 0
            ),
        }
        # ОПЛАЧЕННАЯ наполняемость: сколько мест на занятии реально принесли
        # деньги. Именно она формирует выручку занятия, а не число пришедших:
        # прогульщик со списанием платит, а бесплатная отработка — нет.
        out["avg_group_size"] = (
            _r2(s["paid_units"] / s["lessons"]) if s["lessons"] else 0
        )
        # Сколько человек физически на занятии — справочно.
        out["avg_present_size"] = (
            _r2(s["size_sum"] / s["size_n"]) if s["size_n"] else 0
        )
        return out

    teacher_rows = sorted(
        by_teacher.values(),
        key=lambda x: -(x["group_lessons"] + x["individual_lessons"]),
    )
    for t in teacher_rows:
        t["group_revenue"] = _r2(t["group_revenue"])
        t["individual_revenue"] = _r2(t["individual_revenue"])
        # Наполняемость у педагога — тоже по ОПЛАЧЕННЫМ местам: именно они
        # формируют выручку его занятия.
        t["avg_group_size"] = (
            _r2(t["group_paid_units"] / t["group_lessons"]) if t["group_lessons"] else 0
        )
        t["avg_present_size"] = (
            _r2(t["group_units"] / t["group_lessons"]) if t["group_lessons"] else 0
        )

    return {
        "month": month,
        "individual": pack("individual"),
        "group": pack("group"),
        "teachers": teacher_rows,
        "diag_lessons": diag_lessons,
        "lessons_total": len(lessons),
        "skipped_no_details": skipped_no_details,
        # Сколько выкинули технических карточек («Тест-ученик-1»).
        "skipped_test_units": skipped_test_units,
        "skipped_test_lessons": skipped_test_lessons,
    }


# ---------- БД ----------

def _conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], connect_timeout=10)


def _cache_read(conn, month):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT payload, computed_at FROM {SCHEMA}.margin_unit_cache WHERE month = %s",
            (month,))
        row = cur.fetchone()
    return row if row else None


def _cache_write(conn, month, payload):
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.margin_unit_cache (month, payload) "
            f"VALUES (%s, %s) ON CONFLICT (month) DO UPDATE SET "
            f"payload = EXCLUDED.payload, computed_at = now()",
            (month, Json(payload)))
    conn.commit()


def handler(event: dict, context) -> dict:
    """Отчёт «Маржинальность урока»: факт месяца из CRM и хранение расчётов."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": "", "isBase64Encoded": False}

    params = event.get("queryStringParameters") or {}
    action = (params.get("action") or "").strip()

    try:
        if method == "GET":
            if action == "fact":
                month = (params.get("month") or "").strip()
                if not re.fullmatch(r"\d{4}-\d{2}", month):
                    return _json({"success": False, "error": "month=YYYY-MM обязателен"}, 400)
                conn = _conn()
                try:
                    if params.get("refresh") != "1":
                        cached = _cache_read(conn, month)
                        if cached:
                            return _json({"success": True, "data": cached[0],
                                          "cached": True, "computed_at": cached[1]})
                    data = _build_month(_token(), month, _test_customer_ids(conn))
                    _cache_write(conn, month, data)
                    return _json({"success": True, "data": data, "cached": False})
                finally:
                    conn.close()

            if action == "defaults":
                conn = _conn()
                try:
                    with conn.cursor() as cur:
                        cur.execute(
                            f"SELECT payload FROM {SCHEMA}.unit_margin_defaults WHERE id = 1")
                        row = cur.fetchone()
                    return _json({"success": True, "defaults": row[0] if row else None})
                finally:
                    conn.close()

            if action == "reports":
                conn = _conn()
                try:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute(f"""
                            SELECT id, period_month, title, inputs, result, note,
                                   author, created_at, updated_at
                            FROM {SCHEMA}.unit_margin_reports
                            ORDER BY period_month DESC, created_at DESC
                            LIMIT 200
                        """)
                        return _json({"success": True, "reports": cur.fetchall()})
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
                            INSERT INTO {SCHEMA}.unit_margin_reports
                                (period_month, title, inputs, result, note, author)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            RETURNING id, period_month, title, inputs, result, note,
                                      author, created_at, updated_at
                        """, (
                            (body.get("period_month") or "").strip()[:7],
                            (body.get("title") or "").strip()[:255],
                            Json(body.get("inputs") or {}),
                            Json(body.get("result") or {}),
                            (body.get("note") or "").strip(),
                            (body.get("author") or "").strip()[:255],
                        ))
                        row = cur.fetchone()
                    conn.commit()
                    return _json({"success": True, "report": row})

                if act == "delete":
                    rid = body.get("id")
                    if not rid:
                        return _json({"success": False, "error": "id обязателен"}, 400)
                    with conn.cursor() as cur:
                        cur.execute(
                            f"DELETE FROM {SCHEMA}.unit_margin_reports WHERE id = %s",
                            (int(rid),))
                    conn.commit()
                    return _json({"success": True})

                if act == "save_defaults":
                    with conn.cursor() as cur:
                        cur.execute(f"""
                            INSERT INTO {SCHEMA}.unit_margin_defaults (id, payload, updated_at)
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
        print(f"unit-margin failed: {e}")
        return _json({"success": False, "error": str(e)}, 500)