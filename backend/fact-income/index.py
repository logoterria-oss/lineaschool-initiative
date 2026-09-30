import os
import re
import json
import requests
import psycopg2
from datetime import date, datetime, timedelta
from concurrent.futures import ThreadPoolExecutor

"""
Фактические доходы: сколько занятий проведено по каждому ученику и по какой цене.

В отличие от «Авансовых доходов» (деньги, пришедшие на счёт) здесь считается
заработанное: проведённый урок × цена списания за этот урок.

Источник — AlfaCRM S20. У каждого проведённого занятия (status=3) в details
лежит запись на каждого ребёнка со списанной суммой (commission). Считаем
именно списание, а не присутствие: прогул по неуважительной причине CRM
списывает (урок оплачен и сгорел), по уважительной — нет.

Диагностика в CRM стоит 0 ₽, поэтому её цену берём из прайса на дату
занятия (_diag_price). Раньше сумма бралась из оплат (payment_leads), но это
занижало факт: часть диагностик оплачена наличными, переводом или вовсе не
попала в payment_leads, и проведённая работа уходила в ноль. Считаем так же,
как занятия: провели — заработали.

Первичная диагностика (первая в жизни ученика) и промежуточная (у того, кто
уже занимался платно) стоят по-разному, поэтому диагностику относим к одной
из них по истории: были ли у ученика платные уроки в предыдущих месяцах.

Учебный год: сентябрь → август (как в рабочей таблице «Факт»).

GET ?year=2026            — весь учебный год (сент. 2025 — авг. 2026)
GET ?month=YYYY-MM        — один месяц
GET ?month=YYYY-MM&debug=1&cid=ID — разведка по ученику
"""

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}


def _json(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


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
    resp = requests.post(
        f"{S20_HOST}/v2api/auth/login",
        json={"email": S20_EMAIL, "api_key": os.environ["S20_API_KEY"]},
        headers=_headers(), timeout=20,
    )
    resp.raise_for_status()
    return resp.json()["token"]


def _fetch_lessons(token, date_from, date_to, status=3):
    """Занятия за период. Первая страница даёт total, остальные тянем разом."""
    url = f"{S20_HOST}/v2api/1/lesson/index"
    page_size = 200

    def page(p):
        payload = {"date_from": date_from, "date_to": date_to,
                   "page": p, "pageSize": page_size}
        if status is not None:
            payload["status"] = status
        r = requests.post(url, json=payload, headers=_headers(token), timeout=40)
        r.raise_for_status()
        return r.json()

    first = page(0)
    items = first.get("items", [])
    total = first.get("total", 0)
    if not items or len(items) >= total:
        return items
    last = (total + page_size - 1) // page_size
    with ThreadPoolExecutor(max_workers=8) as ex:
        for data in ex.map(page, range(1, last)):
            items.extend(data.get("items", []))
    return items


def _fetch_customers(token):
    """Все ученики CRM, включая архивных: {id: {name, status}}."""
    url = f"{S20_HOST}/v2api/1/customer/index"
    out = {}
    for is_study, removed in ((1, 0), (1, 1), (0, 0), (0, 1)):
        page = 0
        while True:
            r = requests.post(url, json={"page": page, "pageSize": 200,
                                         "is_study": is_study, "removed": removed},
                              headers=_headers(token), timeout=30)
            if r.status_code != 200:
                break
            data = r.json()
            items = data.get("items", [])
            for c in items:
                # Клиент из выборки removed=1 — в архиве, считаем ушедшим.
                st = 3 if removed else c.get("study_status_id")
                out.setdefault(c.get("id"), {
                    "name": c.get("name") or "",
                    "status": st,
                    "archived": bool(removed),
                    "is_study": bool(is_study),
                })
            page += 1
            if not items or page * 200 >= data.get("total", 0):
                break
    return out


def _is_test_customer(name):
    """Техническая карточка для проверок — в доходы не берём.

    Ищем слово «тест» В ЛЮБОМ месте имени: в CRM есть и «Тест-ученик-1»,
    и «Юля Тест-ученик-2». Смотрим на отдельное слово, чтобы настоящие
    фамилии вроде «Тестова Мария» не пропали.
    """
    s = (name or "").strip().lower().replace("ё", "е")
    if not s:
        return False
    return bool(re.search(r"(?<![а-яa-z])(тест|test)(ов(ый|ая|ое|ые))?(?![а-яa-z])", s))


def _month_bounds(month):
    y, m = int(month[:4]), int(month[5:7])
    first = date(y, m, 1)
    last = date(y + (m == 12), (m % 12) + 1, 1) - timedelta(days=1)
    return first.isoformat(), last.isoformat()


def _year_months(year):
    """Учебный год: сентябрь предыдущего календарного → август текущего."""
    out = []
    for m in range(9, 13):
        out.append(f"{year - 1}-{m:02d}")
    for m in range(1, 9):
        out.append(f"{year}-{m:02d}")
    return out


# ---------- имена ----------

_EMOJI = re.compile(
    "[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF\uFE0F\u200d]+"
)


def _clean(name):
    return _EMOJI.sub("", name or "").replace("  ", " ").strip()


def surname_first(name):
    """«Рита Алексеева» → «Алексеева Рита»: в таблице фамилия идёт первой."""
    parts = _clean(name).split()
    if len(parts) == 2:
        # В CRM обычно «Имя Фамилия». Фамилия — слово с типичным окончанием.
        first, second = parts
        return f"{second} {first}"
    return " ".join(parts)


def _norm(name):
    """Ключ для сверки имён: без регистра, порядка слов и лишних знаков."""
    s = _clean(name).lower().replace("ё", "е")
    s = re.sub(r"[^а-яa-z ]", " ", s)
    return " ".join(sorted(w for w in s.split() if len(w) > 1))


# ---------- цена диагностики ----------

# Прайс диагностик по месяцам: с какого месяца сколько стоит.
# Первичная — первая диагностика ученика, промежуточная — контроль динамики
# у того, кто уже занимается. До февраля 2026 диагностика была бесплатной,
# промежуточная появилась в прайсе вместе с новыми тарифами в сентябре 2026.
_PRIMARY_DIAG_PRICES = [("2026-02", 1290), ("2026-09", 1490), ("2026-10", 2190)]
_INTERIM_DIAG_PRICES = [("2026-09", 2000)]


def _price_at(schedule, month):
    price = 0
    for since, value in schedule:
        if month >= since:
            price = value
    return price


def _diag_price(month, is_interim):
    """Сколько стоит проведённая в этом месяце диагностика."""
    return _price_at(_INTERIM_DIAG_PRICES if is_interim
                     else _PRIMARY_DIAG_PRICES, month)


def _first_paid_months():
    """Первый месяц платных занятий по каждому ученику: {cid: 'YYYY-MM'}.

    Нужен, чтобы отличить первичную диагностику от промежуточной: если
    платные уроки шли раньше — значит это контроль динамики, а не знакомство.
    Историю берём из кэша: там лежат все посчитанные ранее месяцы.
    """
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    out = {}
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        with conn.cursor() as cur:
            # Разбор json делаем в базе: тянуть все месяцы кэша в функцию
            # долго, а нужен из них только первый платный месяц ученика.
            cur.execute(
                f"SELECT (s.cid)::int, min(c.month) FROM {schema}.fact_income_cache c, "
                f"LATERAL jsonb_each(c.payload->'agg') AS s(cid, item) "
                f"WHERE s.item->'prices' <> '{{}}'::jsonb GROUP BY 1")
            out = {cid: month for cid, month in cur.fetchall()}
        conn.close()
    except Exception as e:
        print(f"first paid months failed: {e}")
    return out


# ---------- сборка ----------

def _month_data(token, month):
    """Факт за месяц по каждому ученику CRM: {cid: {lessons, prices, diag}}."""
    date_from, date_to = _month_bounds(month)
    lessons = _fetch_lessons(token, date_from, date_to, status=3)
    agg = {}
    for ls in lessons:
        is_diag = "диагност" in (ls.get("lesson_type_name") or "").lower()
        for d in ls.get("details") or []:
            if not isinstance(d, dict):
                continue
            cid = d.get("customer_id")
            if cid is None:
                continue
            price = round(float(d.get("commission") or 0))
            item = agg.setdefault(cid, {"prices": {}, "diag": 0})
            if is_diag:
                item["diag"] += 1
                continue
            if price <= 0:
                continue
            item["prices"][price] = item["prices"].get(price, 0) + 1
    return agg, len(lessons)


def _mark_cells(cells, status):
    """Метки месяцев — те же цвета, что в рабочей таблице «Факт».

    new      (зелёный)  — первый месяц, когда ученик начал платно заниматься;
    lead     (жёлтый)   — прошёл диагностику, абонемент ещё не купил;
    vacation (голубой)  — учился раньше, в этом месяце занятий не было;
    left     (красный)  — последний месяц занятий, дальше пусто и ученик ушёл.
    """
    last_paid = -1
    for i, c in enumerate(cells):
        if c["lessons"] > 0:
            last_paid = i

    started = False
    for i, c in enumerate(cells):
        c["mark"] = ""
        if c["lessons"] > 0:
            if not started:
                c["mark"] = "new"
                started = True
        elif c["diag_count"] > 0 or c["diag_amount"] > 0:
            # Диагностика была, абонемента ещё нет — это лид.
            c["mark"] = "" if started else "lead"
        elif started and i <= last_paid:
            c["mark"] = "vacation"
        elif started:
            # После последнего месяца занятий: ушёл или в отпуске.
            c["mark"] = "" if i > last_paid + 0 and status in (2, 3) else "vacation"

    # Последний месяц занятий помечаем как уход, если дальше пусто
    # и в CRM ученик завершил обучение или отчислен.
    if last_paid >= 0 and last_paid < len(cells) - 1 and status in (2, 3):
        cells[last_paid]["mark"] = "left"
        for c in cells[last_paid + 1:]:
            c["mark"] = ""
    return cells


def _merge_duplicates(rows):
    """Склеиваем строки одного ребёнка.

    В CRM ребёнок часто заведён дважды: карточка лида (по ней прошла
    диагностика) и карточка ученика (по ней идут занятия). В таблице это
    один человек, поэтому суммы месяцев складываем в одну строку.
    """
    by_key = {}
    order = []
    for r in rows:
        key = _norm(r["crm_name"])
        words = set(key.split())
        target = key if key in by_key else None
        if target is None:
            # «Барбакарь Вероника» и «Барбакарь Вероника Константиновна» —
            # один ребёнок: одна запись целиком входит в другую.
            for k in order:
                kw = set(k.split())
                if words and kw and (words <= kw or kw <= words):
                    target = k
                    break
        if target is None:
            by_key[key] = r
            order.append(key)
            continue
        base = by_key[target]
        # Показываем более полное написание имени.
        if len(r["name"]) > len(base["name"]):
            base["name"] = r["name"]
        for a, b in zip(base["cells"], r["cells"]):
            a["lessons"] += b["lessons"]
            # Карточка лида и карточка ученика — один ребёнок, диагностика
            # у них одна. Цену показываем ту, что не нулевая.
            a["diag_count"] += b["diag_count"]
            a["diag_amount"] += b["diag_amount"]
            a["diag_price"] = a["diag_price"] or b["diag_price"]
            a["amount"] += b["amount"]
            merged = {p["price"]: p["count"] for p in a["prices"]}
            for p in b["prices"]:
                merged[p["price"]] = merged.get(p["price"], 0) + p["count"]
            a["prices"] = [{"price": p, "count": q}
                           for p, q in sorted(merged.items(), key=lambda x: -x[1])]
        base["total"] = sum(c["amount"] for c in base["cells"])
        # Действующий статус берём у той карточки, где ученик ещё учится.
        if base.get("status") in (2, 3) and r.get("status") not in (2, 3):
            base["status"] = r.get("status")
        _mark_cells(base["cells"], base.get("status"))
    return [by_key[k] for k in order]


def _cache_read(months):
    """Готовые месяцы из кэша: {месяц: (данные, число занятий)}."""
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    out = {}
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        with conn.cursor() as cur:
            lst = ",".join(f"'{m}'" for m in months)
            cur.execute(f"SELECT month, payload FROM {schema}.fact_income_cache "
                        f"WHERE month IN ({lst})")
            for m, payload in cur.fetchall():
                agg = {int(k): v for k, v in (payload.get("agg") or {}).items()}
                for v in agg.values():
                    v["prices"] = {int(p): q for p, q in (v.get("prices") or {}).items()}
                out[m] = (agg, payload.get("lessons", 0))
        conn.close()
    except Exception as e:
        print(f"cache read failed: {e}")
    return out


def _cache_write(month, agg, lessons):
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        payload = json.dumps({"agg": agg, "lessons": lessons}, ensure_ascii=False)
        payload = payload.replace("'", "''")
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {schema}.fact_income_cache (month, payload) "
                f"VALUES ('{month}', '{payload}'::jsonb) "
                f"ON CONFLICT (month) DO UPDATE SET payload = EXCLUDED.payload, "
                f"computed_at = now()")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"cache write failed: {e}")


def _build_year(token, months, refresh=False):
    monthly = {}
    lessons_count = {}
    cached = {} if refresh else _cache_read(months)
    todo = [m for m in months if m not in cached]
    for m, (agg, cnt) in cached.items():
        monthly[m], lessons_count[m] = agg, cnt

    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(_month_data, token, m): m for m in todo}
        for f in futures:
            m = futures[f]
            try:
                monthly[m], lessons_count[m] = f.result()
                _cache_write(m, monthly[m], lessons_count[m])
            except Exception as e:
                print(f"month {m} failed: {e}")
                monthly[m], lessons_count[m] = {}, 0

    customers = _fetch_customers(token)
    # Технические карточки («Тест-ученик-1») — не настоящая работа школы,
    # в доходах им делать нечего.
    for cid in [c for c, i in customers.items() if _is_test_customer(i.get("name"))]:
        customers.pop(cid, None)
        for m in months:
            monthly.get(m, {}).pop(cid, None)

    # Первый платный месяц ученика — по нему отличаем первичную диагностику
    # от промежуточной. Берём историю из кэша и дополняем текущей выборкой:
    # для ученика, начавшего заниматься в запрошенном году, кэш ещё пуст.
    first_paid = _first_paid_months()
    for m in sorted(months):
        for cid, item in (monthly.get(m) or {}).items():
            if item.get("prices") and m < first_paid.get(cid, "9999-99"):
                first_paid[cid] = m

    # Список учеников: все, у кого в году был урок или диагностика.
    cids = set()
    for m in months:
        cids.update(monthly[m].keys())

    rows = []
    for cid in cids:
        info = customers.get(cid) or {}
        raw_name = info.get("name") or f"#{cid}"
        display = surname_first(raw_name)
        started = first_paid.get(cid)

        cells = []
        for m in months:
            item = monthly[m].get(cid) or {"prices": {}, "diag": 0}
            parts = sorted(item["prices"].items(), key=lambda p: -p[1])
            lessons_total = sum(q for _, q in parts)
            amount = sum(p * q for p, q in parts)

            # Диагностика у того, кто начал заниматься в прошлые месяцы, —
            # промежуточная: смотрим динамику, а не знакомимся.
            diag_count = item["diag"]
            is_interim = bool(started) and started < m
            diag_price = _diag_price(m, is_interim)
            diag_amount = diag_count * diag_price
            cells.append({
                "month": m,
                "lessons": lessons_total,
                "prices": [{"price": p, "count": q} for p, q in parts],
                "diag_count": diag_count,
                "diag_price": diag_price,
                "diag_amount": diag_amount,
                "amount": amount + diag_amount,
            })

        _mark_cells(cells, info.get("status"))

        total = sum(c["amount"] for c in cells)
        if total <= 0:
            continue
        rows.append({
            "customer_id": cid,
            "name": display,
            "crm_name": raw_name,
            "status": info.get("status"),
            "cells": cells,
            "total": total,
        })

    rows = _merge_duplicates(rows)
    rows.sort(key=lambda r: r["name"].lower())

    totals = []
    for i, m in enumerate(months):
        month_sum = sum(r["cells"][i]["amount"] for r in rows)
        paying = sum(1 for r in rows if r["cells"][i]["amount"] > 0)
        new = sum(1 for r in rows if r["cells"][i]["mark"] == "new")
        left = sum(1 for r in rows if r["cells"][i]["mark"] == "left")
        totals.append({
            "month": m,
            "total": month_sum,
            "students": paying,
            "new": new,
            "left": left,
            "avg_check": round(month_sum / paying) if paying else 0,
            "lessons": lessons_count.get(m, 0),
        })

    return rows, totals


def handler(event: dict, context) -> dict:
    """Фактические доходы: проведённые уроки × цена списания по каждому ученику."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    token = _token()

    if params.get("names"):
        cust = _fetch_customers(token)
        q = (params.get("names") or "").lower()
        out = [{"id": cid, **info} for cid, info in cust.items()
               if q == "1" or q in (info.get("name") or "").lower()]
        return _json(200, {"count": len(out), "customers": out})

    if params.get("debug"):
        month = (params.get("month") or datetime.now().strftime("%Y-%m")).strip()
        date_from, date_to = _month_bounds(month)
        st = params.get("status")
        st = None if st == "all" else (int(st) if st else 3)
        lessons = _fetch_lessons(token, date_from, date_to, status=st)
        cid = params.get("cid")
        if cid:
            cid = int(cid)
            out = []
            for ls in lessons:
                for d in ls.get("details") or []:
                    if isinstance(d, dict) and d.get("customer_id") == cid:
                        out.append({"date": ls.get("date"), "status": ls.get("status"),
                                    "type": ls.get("lesson_type_name"),
                                    "is_attend": d.get("is_attend"),
                                    "reason": d.get("reason_name"),
                                    "commission": d.get("commission")})
            return _json(200, {"month": month, "cid": cid,
                               "count": len(out), "lessons": out})
        sample = lessons[:3]
        return _json(200, {"month": month, "lessons_total": len(lessons),
                           "sample": sample})

    month = (params.get("month") or "").strip()
    if month:
        months = [month]
        year = int(month[:4])
    else:
        year = int(params.get("year") or datetime.now().year)
        months = _year_months(year)

    refresh = params.get("refresh") == "1"
    rows, totals = _build_year(token, months, refresh=refresh)
    return _json(200, {
        "year": year,
        "months": months,
        "rows": rows,
        "totals": totals,
    })