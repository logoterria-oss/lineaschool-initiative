"""
Корректность абонементов в CRM.

Сверяем три вещи по каждой оплате месяца:
1) деньги, которые пришли нам (payment_leads — эквайринг и ручные оплаты);
2) оплату, проведённую в CRM (pay/index);
3) абонемент, который стоит у ученика в CRM (customer-tariff + tariff).

Плюс смотрим проведённые после оплаты уроки: если CRM списывает их по цене
не того абонемента (например, 1200 ₽ по архивному вместо 1470 ₽ по новому),
значит абонемент забыли поменять.

GET ?month=YYYY-MM — шаг 1: оплаты наши ↔ оплаты в CRM.
POST ?action=check {rows} — шаг 2: абонементы и списания по пачке учеников
(CRM медленная, а у функции 5 секунд — поэтому страница дозирует пачки).
Нужен вход сотрудника (админ или руководитель).
"""
import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta

import psycopg2
import requests
from psycopg2.extras import RealDictCursor

from crm_match import find_customer

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
# Оплату в CRM могут провести на пару дней позже/раньше поступления
PAY_WINDOW_DAYS = 3
# Абонемент считаем вовремя заведённым, если он начался не позже этого срока
TARIFF_GRACE_DAYS = 2

CORS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}


def _json(payload, code=200):
    return {"statusCode": code, "headers": CORS,
            "body": json.dumps(payload, ensure_ascii=False, default=str)}


def _money(v):
    return f"{v:,.0f}".replace(",", " ")


# ---------- CRM ----------

def _headers(token=None):
    h = {"X-APP-KEY": os.environ["S20_X_APP_KEY"], "Content-Type": "application/json",
         "Accept": "application/json"}
    if token:
        h["X-ALFACRM-TOKEN"] = token
    return h


_TOKEN = {"value": None, "at": 0.0}


def _token():
    """Токен CRM живёт 10 минут в тёплом экземпляре — меньше логинов и отказов 429."""
    if _TOKEN["value"] and time.time() - _TOKEN["at"] < 600:
        return _TOKEN["value"]
    r = requests.post(f"{S20_HOST}/v2api/auth/login",
                      json={"email": S20_EMAIL, "api_key": os.environ["S20_API_KEY"]},
                      headers=_headers(), timeout=20)
    r.raise_for_status()
    _TOKEN.update(value=r.json()["token"], at=time.time())
    return _TOKEN["value"]


def _paged(token, path, payload, page_size=200, workers=6):
    """Первая страница даёт total, остальные тянем разом."""
    def page(p):
        body = dict(payload)
        body.update({"page": p, "pageSize": page_size})
        r = _post_retry(f"{S20_HOST}{path}", body, token, timeout=30)
        r.raise_for_status()
        return r.json()

    first = page(0)
    items = list(first.get("items", []))
    total = first.get("total", 0)
    if not items or len(items) >= total:
        return items
    last = (total + page_size - 1) // page_size
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for data in ex.map(page, range(1, last)):
            items.extend(data.get("items", []))
    return items


def _post_retry(url, body, token, timeout=15):
    """CRM отвечает 429 при всплеске запросов — одна пауза и повтор."""
    for attempt in range(2):
        r = requests.post(url, json=body, headers=_headers(token), timeout=timeout)
        if r.status_code != 429:
            return r
        time.sleep(0.8)
    return r


def _customer_tariffs(token, cids):
    """{cid: [абонементы]} или None для ученика, если CRM не ответила —
    тогда не делаем вывод «абонемента нет», а помечаем как непроверенное."""
    def one(cid):
        try:
            r = _post_retry(f"{S20_HOST}/v2api/1/customer-tariff/index?customer_id={cid}",
                            {"page": 0, "pageSize": 100}, token)
            return r.json().get("items", []) if r.status_code == 200 else None
        except Exception as e:
            print(f"customer-tariff {cid}: {e}")
            return None

    with ThreadPoolExecutor(max_workers=6) as ex:
        return dict(zip(cids, ex.map(one, cids)))


# ---------- помощники ----------

def _num(v):
    try:
        return round(float(str(v).replace(",", ".")), 2)
    except (TypeError, ValueError):
        return 0.0


def _d(v):
    s = str(v or "").strip()[:10]
    if not s:
        return None
    m = re.fullmatch(r"(\d{2})\.(\d{2})\.(\d{4})", s)
    try:
        if m:
            return date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        return date.fromisoformat(s)
    except ValueError:
        return None


def _is_archive(name):
    return bool(re.search(r"архивн", name or "", re.I))


def _is_diag(name):
    n = name or ""
    return bool(re.match(r"\s*(ПУ|ПДУ)\b", n)) or "диагност" in n.lower()


def _month_bounds(month):
    y, m = int(month[:4]), int(month[5:7])
    first = date(y, m, 1)
    nxt = date(y + (m == 12), (m % 12) + 1, 1)
    return first, nxt - timedelta(days=1)


def _conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _me(cur, event):
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    if not token:
        return None
    cur.execute(
        f"SELECT s.id, s.full_name, s.role FROM {SCHEMA}.staff_sessions ss "
        f"JOIN {SCHEMA}.staff s ON s.id = ss.staff_id "
        "WHERE ss.token = %s AND ss.expires_at > now() AND s.status = 'active'",
        (token,),
    )
    return cur.fetchone()


# ---------- сверка ----------

def _our_payments(cur, d_from, d_to):
    cur.execute(
        f"SELECT id, name, crm_name, plan, amount, source, "
        f"(paid_at + interval '3 hours')::date AS pay_date "
        f"FROM {SCHEMA}.payment_leads WHERE paid_at IS NOT NULL "
        f"AND (paid_at + interval '3 hours')::date BETWEEN %s AND %s ORDER BY paid_at",
        (d_from, d_to),
    )
    return cur.fetchall()


def _norm(s):
    return re.sub(r"\s+", " ", (s or "").strip().lower().replace("ё", "е"))


def _customer_ids(cur, payments):
    """Карточка CRM для каждой оплаты: сначала точное имя, потом нестрогий поиск."""
    cur.execute(f"SELECT id, name FROM {SCHEMA}.crm_customers_cache")
    rows = cur.fetchall()
    by_name = {}
    for r in rows:
        by_name.setdefault(_norm(r["name"]), r["id"])
    names = [r["name"] for r in rows]
    out = {}
    for p in payments:
        cid = None
        for raw in (p.get("crm_name"), p.get("name")):
            raw = (raw or "").strip()
            if not raw or "," in raw:
                continue
            cid = by_name.get(_norm(raw))
            if cid is None:
                found = find_customer(raw, names)
                if found and "," not in found:
                    cid = by_name.get(_norm(found))
            if cid:
                break
        out[p["id"]] = cid
    return out, {r["id"]: r["name"] for r in rows}


def _lesson_charges(lessons):
    """{cid: [(date, commission)]} — списания за проведённые уроки."""
    out = {}
    for ls in lessons:
        day = _d(ls.get("date"))
        for det in ls.get("details") or []:
            if not isinstance(det, dict) or det.get("customer_id") is None:
                continue
            out.setdefault(det["customer_id"], []).append((day, _num(det.get("commission"))))
    return out


def _tariff_on(items, tariffs, day):
    """Абонемент ученика, действующий в этот день (последний начавшийся)."""
    best = None
    for t in items:
        b, e = _d(t.get("b_date")), _d(t.get("e_date"))
        if b and b <= day and (e is None or e >= day):
            if best is None or b > best[0]:
                best = (b, e, t.get("tariff_id"))
    if not best:
        return None
    tar = tariffs.get(best[2]) or {}
    return {"name": tar.get("name") or f"#{best[2]}", "price": tar.get("price"),
            "since": best[0], "till": best[1], "archive": _is_archive(tar.get("name"))}


def _tariff_id_on(items, day):
    best = None
    for t in items:
        b, e = _d(t.get("b_date")), _d(t.get("e_date"))
        if b and b <= day and (e is None or e >= day) and (best is None or b > best[0]):
            best = (b, t.get("tariff_id"))
    return best[1] if best else None


def _check(row, ct_items, tariffs, charges, next_pay):
    """Проверка абонемента и списаний для одной оплаты."""
    amount, day = row["amount"], row["date"]
    issues = []
    fitting = [t for t in tariffs.values() if t["price"] and abs(t["price"] - amount) < 1]
    if _is_diag(row.get("plan")) or (fitting and all(_is_diag(t["name"]) for t in fitting)):
        row["kind"] = "diagnostic"
    else:
        row["kind"] = "subscription"

    current = _tariff_on(ct_items, tariffs, day) if ct_items else None
    row["tariffAtPayment"] = current
    today = date.today()
    row["tariffNow"] = _tariff_on(ct_items, tariffs, today) if ct_items else None

    if row["kind"] == "diagnostic":
        return issues

    if not fitting:
        issues.append({"code": "no_tariff_price",
                       "text": f"В CRM нет абонемента стоимостью {_money(amount)} ₽ — проверьте, за что оплата"})
        return issues

    fit_ids = {t["id"] for t in fitting}
    per_lesson = sorted({round(t["price"] / t["lessons_count"]) for t in fitting if t["lessons_count"]})
    row["expectedTariff"] = " / ".join(sorted({t["name"] for t in fitting}))
    row["expectedLessonPrice"] = per_lesson

    # Подходящий по цене абонемент, который ещё действовал на дату оплаты или начат позже
    match = None
    for t in ct_items:
        if t.get("tariff_id") not in fit_ids:
            continue
        b, e = _d(t.get("b_date")), _d(t.get("e_date"))
        if e and e < day:
            continue
        if match is None or (b and match[0] and b < match[0]):
            match = (b, e)
    if match is None:
        now_name = current["name"] if current else "абонемента нет"
        issues.append({"code": "tariff_not_changed",
                       "text": f"Абонемент не заменён: в CRM стоит «{now_name}», оплачен «{row['expectedTariff']}»"})
    elif match[0] and (match[0] - day).days > TARIFF_GRACE_DAYS:
        late = (match[0] - day).days
        issues.append({"code": "tariff_late",
                       "text": f"Абонемент заменили с опозданием: оплата {day:%d.%m}, новый абонемент с {match[0]:%d.%m} (+{late} дн.)"})

    # Уроки после оплаты, которые CRM списала по другому (старому) абонементу:
    # смотрим, какой абонемент стоял у ученика в день урока
    till = next_pay or (today + timedelta(days=1))
    diag_prices = {t["price"] for t in tariffs.values() if _is_diag(t["name"]) and t["price"]}
    wrong = []
    for d_, c in sorted(charges):
        if not d_ or not (day <= d_ < till) or c <= 0 or c in diag_prices:
            continue
        on = _tariff_id_on(ct_items, d_)
        if on not in fit_ids:
            wrong.append((d_, c, (tariffs.get(on) or {}).get("name") or "без абонемента"))
    if wrong and per_lesson:
        expected = max(per_lesson)
        diff = sum(expected - c for _x, c, _n in wrong)
        prices = sorted({c for _x, c, _n in wrong})
        row["wrongLessons"] = [{"date": d_, "charged": c, "tariff": n} for d_, c, n in wrong]
        issues.append({"code": "wrong_lesson_price",
                       "text": (f"{len(wrong)} ур. после оплаты списаны по старому абонементу "
                                f"({', '.join(_money(p) for p in prices)} ₽ вместо {_money(expected)} ₽)"),
                       "diff": round(diff)})
    return issues


def _tariff_dict(token):
    out = {}
    for t in _paged(token, "/v2api/1/tariff/index", {}):
        out[t["id"]] = {"id": t["id"], "name": (t.get("name") or "").strip(),
                        "price": _num(t.get("price")), "lessons_count": _num(t.get("lessons_count"))}
    return out


def _base(cur, month):
    """Шаг 1: наши оплаты ↔ оплаты в CRM. Быстро: два запроса к CRM."""
    d_from, d_to = _month_bounds(month)
    ours = _our_payments(cur, d_from, d_to)
    for p in ours:
        p["amount"] = _num(p["amount"])
    cid_of, cust_names = _customer_ids(cur, ours)

    token = _token()
    tariffs = _tariff_dict(token)
    crm_pays = [p for p in _paged(token, "/v2api/1/pay/index",
                                  {"date_from": (d_from - timedelta(days=PAY_WINDOW_DAYS)).strftime("%d.%m.%Y"),
                                   "date_to": (d_to + timedelta(days=PAY_WINDOW_DAYS)).strftime("%d.%m.%Y")})
                if p.get("customer_id") and int(p.get("pay_type_id") or 0) == 1 and _num(p.get("income")) > 0]
    for p in crm_pays:
        p["_date"] = _d(p.get("document_date"))
        p["_amount"] = _num(p.get("income"))

    # Наши оплаты ↔ оплаты CRM. Сначала пары с той же суммой, потом остальные:
    # иначе диагностика за 1 490 ₽ «забирает» себе оплату абонемента того же ученика
    used, pair = set(), {}
    for exact in (True, False):
        for p in ours:
            cid = cid_of.get(p["id"])
            if not cid or p["id"] in pair:
                continue
            best = None
            for cp in crm_pays:
                if cp["id"] in used or cp["customer_id"] != cid or not cp["_date"]:
                    continue
                same = abs(cp["_amount"] - p["amount"]) < 1
                if exact != same:
                    continue
                # Неточная пара — только опечатка в сумме (±10%), а не
                # диагностика против абонемента того же ученика
                if not exact and abs(cp["_amount"] - p["amount"]) > p["amount"] * 0.1:
                    continue
                if not exact and any(cid_of.get(o["id"]) == cid and o["id"] not in pair
                                     and abs(o["amount"] - cp["_amount"]) < 1 for o in ours):
                    continue
                gap = abs((cp["_date"] - p["pay_date"]).days)
                if gap > PAY_WINDOW_DAYS:
                    continue
                if best is None or gap < best[0]:
                    best = (gap, cp)
            if best:
                used.add(best[1]["id"])
                pair[p["id"]] = best[1]

    rows = []
    for p in ours:
        cid = cid_of.get(p["id"])
        crm = pair.get(p["id"])
        rows.append({
            "key": f"our-{p['id']}", "source": "ours", "customerId": cid,
            "student": cust_names.get(cid) or p.get("crm_name") or p.get("name"),
            "date": p["pay_date"], "amount": p["amount"], "plan": p.get("plan") or "",
            "paySource": p.get("source") or "",
            "crmPay": {"id": crm["id"], "date": crm["_date"], "amount": crm["_amount"],
                       "payer": crm.get("payer_name") or ""} if crm else None,
        })

    # Оплаты в CRM за месяц без поступления у нас (наличные, переводы на карту)
    for cp in crm_pays:
        if cp["id"] in used or not cp["_date"] or not (d_from <= cp["_date"] <= d_to):
            continue
        cid = cp["customer_id"]
        rows.append({
            "key": f"crm-{cp['id']}", "source": "crm_only", "customerId": cid,
            "student": cust_names.get(cid) or (cp.get("payer_name") or f"Клиент CRM #{cid}"),
            "date": cp["_date"], "amount": cp["_amount"], "plan": "", "paySource": "",
            "crmPay": {"id": cp["id"], "date": cp["_date"], "amount": cp["_amount"],
                       "payer": cp.get("payer_name") or ""},
        })

    diag_prices = {t["price"] for t in tariffs.values() if _is_diag(t["name"]) and t["price"]}
    for r in rows:
        r["issues"] = []
        r["kind"] = ("diagnostic" if _is_diag(r["plan"]) or (not r["plan"] and r["amount"] in diag_prices)
                     else "subscription")
        if not r["customerId"]:
            r["issues"].append({"code": "no_customer", "text": "Не нашли ученика в CRM по имени из оплаты"})
        elif r["source"] == "ours" and not r["crmPay"]:
            r["issues"].append({"code": "no_crm_pay", "text": "Оплата не проведена в CRM",
                                "level": "warn" if r["kind"] == "diagnostic" else "error"})
        elif r["crmPay"] and abs(r["crmPay"]["amount"] - r["amount"]) >= 1:
            r["issues"].append({"code": "pay_amount",
                                "text": f"В CRM проведено {_money(r['crmPay']['amount'])} ₽ вместо {_money(r['amount'])} ₽"})
        r["checked"] = not r["customerId"]
        r["status"] = _status(r["issues"]) if r["checked"] else "pending"
    rows.sort(key=lambda r: r["date"], reverse=True)
    return {"month": month, "rows": rows, "tariffs": list(tariffs.values()),
            "builtAt": datetime.utcnow().isoformat() + "Z"}


def _status(issues):
    if any(i.get("level", "error") == "error" for i in issues):
        return "error"
    return "warn" if issues else "ok"


def _check_rows(rows, tariffs=None):
    """Шаг 2: абонементы и списания по пачке учеников (до ~8 за вызов)."""
    token = _token()
    for r in rows:
        r["date"] = _d(r["date"])
    cids = sorted({r["customerId"] for r in rows if r.get("customerId")})
    first = min((r["date"] for r in rows), default=date.today())
    today = date.today()

    def lessons(cid):
        try:
            items = _paged(token, "/v2api/1/lesson/index",
                           {"customer_id": cid, "status": 3, "date_from": first.isoformat(),
                            "date_to": today.isoformat()}, workers=2)
        except Exception as e:
            print(f"lessons {cid}: {e}")
            return None
        return _lesson_charges(items).get(cid, [])

    if not tariffs:
        tariffs = _tariff_dict(token)
    with ThreadPoolExecutor(max_workers=2) as ex:
        f_ct = ex.submit(_customer_tariffs, token, cids)
        f_les = ex.submit(lambda: dict(zip(cids, ThreadPoolExecutor(max_workers=4).map(lessons, cids))))
        ct, charges = f_ct.result(), f_les.result()

    by_cid = {}
    for r in rows:
        by_cid.setdefault(r["customerId"], set()).add(r["date"])
    for r in rows:
        cid = r["customerId"]
        if ct.get(cid) is None or charges.get(cid) is None:
            r["checked"] = False
            r["status"] = "pending"
            r["retry"] = True
            continue
        later = sorted(d_ for d_ in by_cid.get(cid, ()) if d_ > r["date"])
        extra = _check(r, ct.get(cid) or [], tariffs, charges.get(cid) or [], later[0] if later else None)
        r["issues"] = list(r.get("issues") or []) + extra
        r["checked"] = True
        r["status"] = _status(r["issues"])
    return rows


def handler(event: dict, context) -> dict:
    '''Сверка оплат, оплат в CRM и абонементов учеников в CRM за месяц.'''
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    month = params.get("month") or date.today().strftime("%Y-%m")
    if not re.fullmatch(r"\d{4}-\d{2}", month):
        return _json({"error": "bad_month"}, 400)

    conn = _conn()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        me = _me(cur, event)
        if not me or me["role"] not in ("admin", "head"):
            return _json({"error": "unauthorized"}, 401)

        if event.get("httpMethod") == "POST" and params.get("action") == "check":
            body = json.loads(event.get("body") or "{}")
            rows = [r for r in (body.get("rows") or []) if r.get("customerId")][:40]
            tariffs = {int(t["id"]): t for t in (body.get("tariffs") or []) if t.get("id") is not None}
            data = _check_rows(rows, tariffs)
            return _json({"rows": json.loads(json.dumps(data, default=str))})

        return _json(json.loads(json.dumps(_base(cur, month), ensure_ascii=False, default=str)))
    finally:
        conn.close()
