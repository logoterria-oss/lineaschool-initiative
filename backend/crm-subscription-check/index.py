"""
Корректность абонементов в CRM — сводная таблица по всем занимающимся ученикам.

По каждому ученику: последний платёж школе, последняя оплата, проведённая в CRM,
абонемент в CRM и сумма списания за последний урок. Строка зелёная, если:
  1) последний платёж проведён в CRM той же суммой;
  2) у ученика заведён абонемент ровно на эту сумму — действующий или
     начинающийся позже (новый абонемент стартует после окончания текущего,
     а не в день оплаты);
  3) последний урок списан по цене абонемента, действовавшего в день урока.

GET  ?action=list                    — шаг 1: ученики и оплаты (быстро).
POST ?action=check {rows, tariffs}   — шаг 2: абонементы и списания пачкой
     по несколько учеников (у функции 5 секунд, а CRM — запрос на каждого).
Нужен вход сотрудника (админ или руководитель).
"""
import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, wait
from datetime import date, datetime, timedelta

import psycopg2
import requests
from psycopg2.extras import RealDictCursor

from crm_match import find_customer

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
PAYMENTS_DAYS = 365
LESSONS_DAYS = 60
PAY_WINDOW_DAYS = 3
ROW_CACHE_MIN = 10
BATCH_MAX = 4
CHECK_DEADLINE = 3.8
# Проверенные вручную платежи CRM (id), которые не надо сверять с ценой абонемента:
# 410 — Савелий Карцев, остаток перенесён с брата Саши
OK_CRM_PAYMENTS = {410}
MIN_PAY = 1000
DIAG_LESSON_TYPE = 3

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

_TOKEN = {"value": None, "at": 0.0}


def _headers(token=None):
    h = {"X-APP-KEY": os.environ["S20_X_APP_KEY"], "Content-Type": "application/json",
         "Accept": "application/json"}
    if token:
        h["X-ALFACRM-TOKEN"] = token
    return h


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


def _post(url, body, token, timeout=15):
    """CRM отвечает 429 при всплеске запросов — пауза и повтор."""
    r = None
    for _ in range(2):
        r = requests.post(url, json=body, headers=_headers(token), timeout=timeout)
        if r.status_code != 429:
            return r
        time.sleep(0.8)
    return r


def _paged(token, path, payload, page_size=200, workers=4):
    def page(p):
        body = dict(payload)
        body.update({"page": p, "pageSize": page_size})
        r = _post(f"{S20_HOST}{path}", body, token, timeout=30)
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


def _is_diag(name):
    n = name or ""
    return bool(re.match(r"\s*(ПУ|ПДУ)\b", n)) or "диагност" in n.lower()


def _is_test(name):
    s = (name or "").lower().replace("ё", "е")
    return bool(re.search(r"(?<![а-яa-z])(тест|test)(ов(ый|ая|ое|ые))?(?![а-яa-z])", s))


def _norm(s):
    return re.sub(r"\s+", " ", (s or "").strip().lower().replace("ё", "е"))


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


def _tariff_dict(token):
    out = {}
    for t in _paged(token, "/v2api/1/tariff/index", {}):
        price, cnt = _num(t.get("price")), _num(t.get("lessons_count"))
        out[int(t["id"])] = {"id": int(t["id"]), "name": (t.get("name") or "").strip(),
                             "price": price, "lessons_count": cnt,
                             "per_lesson": round(price / cnt) if cnt else None}
    return out


def _diag_prices(tariffs):
    return {t["price"] for t in tariffs.values() if _is_diag(t["name"]) and t["price"]}


# ---------- шаг 1: ученики и оплаты ----------

# Как в «Списке учеников»: 1=Активен, 2=Завершил, 3=Бросил, 4=Каникулы (заморожен), 5=Каникулы
STATUS_NAMES = {1: "Активен", 2: "Завершил", 3: "Бросил",
                4: "Каникулы (заморожен)", 5: "Каникулы"}


def _students(token):
    """Ученики CRM со статусом. Архивные карточки считаем «Бросил»."""
    out = {}
    for removed in (0, 1):
        for c in _paged(token, "/v2api/1/customer/index", {"is_study": 1, "removed": removed}):
            name = (c.get("name") or "").strip()
            if c.get("id") is None or not name or _is_test(name) or int(c["id"]) in out:
                continue
            sid = 3 if removed else c.get("study_status_id")
            out[int(c["id"])] = (name, sid)
    return out


def _base(cur):
    token = _token()
    with ThreadPoolExecutor(max_workers=3) as ex:
        f_st = ex.submit(_students, token)
        f_tar = ex.submit(_tariff_dict, token)
        f_pay = ex.submit(_paged, token, "/v2api/1/pay/index", {
            "date_from": (date.today() - timedelta(days=PAYMENTS_DAYS)).strftime("%d.%m.%Y"),
            "date_to": date.today().strftime("%d.%m.%Y")})
        students, tariffs, pays = f_st.result(), f_tar.result(), f_pay.result()
    diag = _diag_prices(tariffs)

    # Последняя оплата абонемента, проведённая в CRM (диагностики не считаем)
    crm_last = {}
    for p in pays:
        cid = p.get("customer_id")
        amount = _num(p.get("income"))
        d = _d(p.get("document_date"))
        # Доплаты в пару сотен рублей — не оплата абонемента
        if not cid or int(p.get("pay_type_id") or 0) != 1 or amount < MIN_PAY or not d or amount in diag:
            continue
        cid = int(cid)
        prev = crm_last.get(cid)
        if prev is None or (d, p["id"]) > (prev["date"], prev["id"]):
            crm_last[cid] = {"id": p["id"], "date": d, "amount": amount}

    # Последний платёж школе (онлайн-оплата и ручные), сопоставленный с учеником CRM
    cur.execute(
        f"SELECT name, crm_name, plan, amount, (paid_at + interval '3 hours')::date AS d "
        f"FROM {SCHEMA}.payment_leads WHERE paid_at IS NOT NULL "
        f"AND paid_at > now() - interval '{PAYMENTS_DAYS} days' ORDER BY paid_at")
    payments = cur.fetchall()
    by_name = {}
    for cid, (nm, _sid) in students.items():
        by_name.setdefault(_norm(nm), cid)
    names = [nm for nm, _sid in students.values()]
    our_last = {}
    for p in payments:
        amount = _num(p["amount"])
        if amount in diag or _is_diag(p.get("plan")):
            continue
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
        if cid:
            our_last[cid] = {"date": p["d"], "amount": amount, "plan": p.get("plan") or ""}

    rows = [{"customerId": cid, "student": name,
             "studyStatusId": sid, "studyStatus": STATUS_NAMES.get(sid, "—"),
             "ourPay": our_last.get(cid), "crmPay": crm_last.get(cid),
             "checked": False, "status": "pending", "issues": []}
            for cid, (name, sid) in students.items()]
    rows.sort(key=lambda r: _norm(r["student"]))
    return {"rows": rows, "tariffs": list(tariffs.values()),
            "builtAt": datetime.utcnow().isoformat() + "Z"}


# ---------- шаг 2: абонементы и списания ----------

def _customer_tariffs(token, cid):
    try:
        r = _post(f"{S20_HOST}/v2api/1/customer-tariff/index?customer_id={cid}",
                  {"page": 0, "pageSize": 100}, token)
        return r.json().get("items", []) if r.status_code == 200 else None
    except Exception as e:
        print(f"customer-tariff {cid}: {e}")
        return None


def _last_lesson(token, cid, diag):
    """Последний проведённый урок с платным списанием (не диагностика)."""
    try:
        items = _paged(token, "/v2api/1/lesson/index", {
            "customer_id": cid, "status": 3,
            "date_from": (date.today() - timedelta(days=LESSONS_DAYS)).isoformat(),
            "date_to": date.today().isoformat()}, workers=2)
    except Exception as e:
        print(f"lessons {cid}: {e}")
        return None
    best = None
    for ls in items:
        d = _d(ls.get("date"))
        # Диагностику узнаём по типу урока, а не по цене: 2 000 ₽ — это и
        # ПДУ, и урок по абонементу «16 индивидуальных»
        if int(ls.get("lesson_type_id") or 0) == DIAG_LESSON_TYPE:
            continue
        for det in ls.get("details") or []:
            if not isinstance(det, dict) or det.get("customer_id") != cid:
                continue
            c = _num(det.get("commission"))
            if c <= 0 or not d:
                continue
            if best is None or d > best["date"]:
                best = {"date": d, "charged": c}
    return best or {}


def _active_on(items, day):
    """Абонементы, действующие в этот день; первым — начавшийся раньше
    (новый абонемент начинают после окончания текущего)."""
    out = []
    for t in items:
        b, e = _d(t.get("b_date")), _d(t.get("e_date"))
        if b and b <= day and (e is None or e >= day):
            out.append((b, e, t))
    return sorted(out, key=lambda x: x[0])


def _evaluate(row, ct, lesson, tariffs):
    today = date.today()
    issues = []
    our, crm = row.get("ourPay"), row.get("crmPay")
    for p in (our, crm):
        if p and isinstance(p.get("date"), str):
            p["date"] = _d(p["date"])

    def info(entry):
        if not entry:
            return None
        b, e, t = entry
        tar = tariffs.get(int(t.get("tariff_id") or 0)) or {}
        return {"name": tar.get("name") or f"#{t.get('tariff_id')}", "price": tar.get("price"),
                "perLesson": tar.get("per_lesson"), "since": b, "till": e}

    act = _active_on(ct, today)
    now = act[0] if act else None
    if not now:
        started = [(_d(t.get("b_date")), _d(t.get("e_date")), t) for t in ct]
        started = [s for s in started if s[0] and s[0] <= today]
        now = max(started, key=lambda s: s[0]) if started else None
    upcoming = sorted(((_d(t.get("b_date")), _d(t.get("e_date")), t) for t in ct
                       if _d(t.get("b_date")) and _d(t.get("b_date")) > today), key=lambda s: s[0])
    row["tariffNow"] = info(now)
    row["tariffNext"] = info(upcoming[0]) if upcoming else None
    if now and now[1] and now[1] < today:
        row["tariffNow"]["expired"] = True

    # 1. Последний платёж школе проведён в CRM той же суммой
    if our:
        gap = (our["date"] - crm["date"]).days if crm else None
        if crm is None or gap > PAY_WINDOW_DAYS:
            issues.append(f"Платёж от {our['date']:%d.%m.%Y} не проведён в CRM")
        elif abs(gap) <= PAY_WINDOW_DAYS and abs(crm["amount"] - our["amount"]) >= 1:
            issues.append(f"В CRM проведено {_money(crm['amount'])} ₽, а пришло {_money(our['amount'])} ₽")

    # 2. Абонемент на сумму последней оплаты заведён — текущий или следующий.
    # Сумму берём и из CRM, и из нашего платежа: если в CRM опечатка в сумме,
    # это уже показано в пункте 1, второй раз не ругаемся.
    paid = crm or our
    if crm and not our and crm.get("id") in OK_CRM_PAYMENTS:
        pass
    elif not paid:
        issues.append("Нет оплат абонемента за год")
    else:
        amounts = {p["amount"] for p in (our, crm) if p and abs((p["date"] - paid["date"]).days) <= PAY_WINDOW_DAYS}
        fit = {tid for tid, t in tariffs.items() if t["price"] and any(abs(t["price"] - a) < 1 for a in amounts)}
        row["expectedTariff"] = " / ".join(sorted(tariffs[t]["name"] for t in fit)) or None
        has = any(int(t.get("tariff_id") or 0) in fit
                  and (_d(t.get("e_date")) or today) >= paid["date"] for t in ct)
        if not fit:
            issues.append(f"Нет абонемента стоимостью {_money(paid['amount'])} ₽")
        elif not has:
            issues.append(f"Оплачен «{row['expectedTariff']}», но он не заведён ученику")

    # 3. Последний урок списан по цене абонемента, действовавшего в тот день
    if lesson:
        on = _active_on(ct, lesson["date"])
        prices = [(tariffs.get(int(t.get("tariff_id") or 0)) or {}).get("per_lesson") for _b, _e, t in on]
        prices = [p for p in prices if p]
        lesson["expected"] = prices[0] if prices else None
        if not on:
            issues.append(f"Урок {lesson['date']:%d.%m} списан без действующего абонемента")
        elif prices and all(abs(p - lesson["charged"]) > 1 for p in prices):
            issues.append(f"Урок {lesson['date']:%d.%m} списан по {_money(lesson['charged'])} ₽ "
                          f"вместо {_money(prices[0])} ₽")
    row["lastLesson"] = lesson or None

    row["issues"] = issues
    row["status"] = "error" if issues else "ok"
    row["checked"] = True
    return row


def _check(cur, rows, tariffs, refresh):
    t0 = time.time()
    tariffs = {int(t["id"]): t for t in tariffs}
    cids = [int(r["customerId"]) for r in rows]
    cached = {}
    if not refresh and cids:
        cur.execute(
            f"SELECT cache_key, payload FROM {SCHEMA}.crm_json_cache WHERE cache_key = ANY(%s) "
            f"AND updated_at > now() - interval '{ROW_CACHE_MIN} minutes'",
            ([f"subrow:{c}" for c in cids],))
        cached = {int(r["cache_key"].split(":")[1]): r["payload"] for r in cur.fetchall()}

    need = [c for c in cids if c not in cached]
    fresh = {}
    if need:
        token = _token()
        if not tariffs:
            tariffs = _tariff_dict(token)
        diag = _diag_prices(tariffs)
        # CRM иногда отвечает медленно. Ждём не дольше дедлайна и отдаём то,
        # что успели: остальных фронт перезапросит, а не повиснет на таймауте.
        ex = ThreadPoolExecutor(max_workers=8)
        f_ct = {c: ex.submit(_customer_tariffs, token, c) for c in need}
        f_ls = {c: ex.submit(_last_lesson, token, c, diag) for c in need}
        wait(list(f_ct.values()) + list(f_ls.values()), timeout=max(0.5, CHECK_DEADLINE - (time.time() - t0)))
        ex.shutdown(wait=False, cancel_futures=True)
        for c in need:
            if not (f_ct[c].done() and f_ls[c].done()):
                continue
            ct, ls = f_ct[c].result(), f_ls[c].result()
            if ct is not None and ls is not None:
                fresh[c] = {"ct": ct, "lesson": ls}
        for c, data in fresh.items():
            cur.execute(
                f"INSERT INTO {SCHEMA}.crm_json_cache (cache_key, payload, updated_at) "
                "VALUES (%s, %s::jsonb, now()) ON CONFLICT (cache_key) DO UPDATE "
                "SET payload = EXCLUDED.payload, updated_at = now()",
                (f"subrow:{c}", json.dumps(data, ensure_ascii=False, default=str)))

    out = []
    for r in rows:
        c = int(r["customerId"])
        data = fresh.get(c) or cached.get(c)
        if data is None:
            out.append(r)
            continue
        ls = data.get("lesson") or {}
        lesson = {"date": _d(ls["date"]), "charged": _num(ls["charged"])} if ls.get("date") else None
        out.append(_evaluate(dict(r), data.get("ct") or [], lesson, tariffs))
    return out


def handler(event: dict, context) -> dict:
    '''Сводная сверка по ученикам: платёж школе, оплата в CRM, абонемент и списание за урок.'''
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    conn = _conn()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        me = _me(cur, event)
        if not me or me["role"] not in ("admin", "head"):
            return _json({"error": "unauthorized"}, 401)

        if event.get("httpMethod") == "POST" and params.get("action") == "check":
            body = json.loads(event.get("body") or "{}")
            rows = [r for r in (body.get("rows") or []) if r.get("customerId")][:BATCH_MAX]
            res = _check(cur, rows, body.get("tariffs") or [], params.get("refresh") == "1")
            conn.commit()
            return _json({"rows": json.loads(json.dumps(res, default=str))})

        return _json(json.loads(json.dumps(_base(cur), ensure_ascii=False, default=str)))
    finally:
        conn.close()
