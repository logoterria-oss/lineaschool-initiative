"""
Business: Сверка воронки лидов с CRM — диагностики, отмеченные «Проведено»,
переводят лида в «Проведена диагностика». Лида находим по телефону ученика
из кэша клиентов CRM, а без телефона — по ФИО (если совпадение одно).
Args: event с httpMethod (GET), queryStringParameters {days: глубина, по умолчанию 14}
Ещё: ученик, у которого в CRM проведено обычное (не диагностическое) занятие,
считается клиентом — помечаем лида became_client_at, и он пропадает из воронки.
Returns: {ok, done_lessons, moved, clients}
"""
import re
from concurrent.futures import ThreadPoolExecutor
import datetime
import json
import os
from typing import Any, Dict, List

import psycopg2
import requests

from lead_funnel import advance_lead, BEFORE_PAYMENT, ST_DIAG_PAID

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"
SCHEMA = "t_p93118852_lineaschool_initiati"
DIAG_LESSON_TYPE = 3
ST_DONE = 3
ST_DIAG_DONE = "Проведена диагностика"
BEFORE_DONE = BEFORE_PAYMENT + (ST_DIAG_PAID,)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
}


def _json(status: int, payload: dict) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(payload, ensure_ascii=False, default=str)}


def _headers(token: str = None) -> dict:
    h = {"X-APP-KEY": os.environ["S20_X_APP_KEY"], "Content-Type": "application/json",
         "Accept": "application/json"}
    if token:
        h["X-ALFACRM-TOKEN"] = token
    return h


def _token() -> str:
    r = requests.post(f"{S20_HOST}/v2api/auth/login",
                      json={"email": S20_EMAIL, "api_key": os.environ["S20_API_KEY"]},
                      headers=_headers(), timeout=10)
    r.raise_for_status()
    return r.json()["token"]


def _done_diagnostics(token: str, days: int) -> List[dict]:
    today = datetime.date.today()
    payload = {"date_from": (today - datetime.timedelta(days=days)).isoformat(),
               "date_to": today.isoformat(), "status": ST_DONE,
               "lesson_type_id": DIAG_LESSON_TYPE, "pageSize": 200}
    out, page = [], 0
    while True:
        r = requests.post(f"{S20_HOST}/v2api/1/lesson/index", json={**payload, "page": page},
                          headers=_headers(token), timeout=10)
        r.raise_for_status()
        data = r.json()
        items = data.get("items", [])
        out.extend(items)
        if len(out) >= data.get("total", 0) or not items:
            break
        page += 1
    return [ls for ls in out
            if int(ls.get("status") or 0) == ST_DONE
            and (int(ls.get("lesson_type_id") or 0) == DIAG_LESSON_TYPE
                 or "диагност" in str(ls.get("lesson_type_name") or "").lower())]


def _done_regular_customers(token: str, days: int) -> set:
    today = datetime.date.today()
    payload = {"date_from": (today - datetime.timedelta(days=days)).isoformat(),
               "date_to": today.isoformat(), "status": ST_DONE, "pageSize": 200}

    def page(n):
        r = requests.post(f"{S20_HOST}/v2api/1/lesson/index", json={**payload, "page": n},
                          headers=_headers(token), timeout=10)
        r.raise_for_status()
        return r.json()

    first = page(0)
    items = list(first.get("items", []))
    total = int(first.get("total") or 0)
    if items and len(items) < total:
        with ThreadPoolExecutor(max_workers=8) as ex:
            for data in ex.map(page, range(1, (total + 199) // 200)):
                items.extend(data.get("items", []))
    cids = set()
    for ls in items:
        if int(ls.get("status") or 0) != ST_DONE:
            continue
        if int(ls.get("lesson_type_id") or 0) == DIAG_LESSON_TYPE \
                or "диагност" in str(ls.get("lesson_type_name") or "").lower():
            continue
        cids.update(_attended_customers(ls))
    return cids


def _norm(v) -> str:
    return " ".join(str(v or "").split()).lower()


def _mark_clients(cur, cids: set) -> int:
    if not cids:
        return 0
    cur.execute(f"SELECT id, name, phone FROM {SCHEMA}.crm_customers_cache "
                f"WHERE id IN ({', '.join(str(c) for c in sorted(cids))})")
    by_phone, by_name = {}, {}
    for cid, name, phone in cur.fetchall():
        digits = re.sub(r"\D", "", str(phone or ""))
        if len(digits) >= 10:
            by_phone[digits[-10:]] = cid
        if len(_norm(name)) >= 5:
            by_name.setdefault(_norm(name), set()).add(cid)

    cur.execute(f"SELECT id, contact, parent_name, student_name FROM {SCHEMA}.leads "
                f"WHERE became_client_at IS NULL")
    leads = cur.fetchall()
    name_count = {}
    for _id, _c, pn, sn in leads:
        for n in {_norm(pn), _norm(sn)} - {""}:
            name_count[n] = name_count.get(n, 0) + 1

    hits = []
    for lead_id, contact, pn, sn in leads:
        digits = re.sub(r"\D", "", str(contact or ""))
        cid = by_phone.get(digits[-10:]) if len(digits) >= 10 else None
        if cid is None:
            for n in (_norm(sn), _norm(pn)):
                if n in by_name and len(by_name[n]) == 1 and name_count.get(n) == 1:
                    cid = next(iter(by_name[n]))
                    break
        if cid is not None:
            hits.append((lead_id, cid))
    for lead_id, cid in hits:
        cur.execute(f"UPDATE {SCHEMA}.leads SET became_client_at = CURRENT_TIMESTAMP, "
                    f"crm_customer_id = {int(cid)}, updated_at = CURRENT_TIMESTAMP "
                    f"WHERE id = {int(lead_id)} AND became_client_at IS NULL")
    if hits:
        print(f"lead-funnel-sync: стали клиентами лиды {[h[0] for h in hits]}")
    return len(hits)


def _attended_customers(ls: dict) -> List[int]:
    ids = []
    details = ls.get("details") if isinstance(ls.get("details"), list) else []
    for d in details:
        if isinstance(d, dict) and d.get("customer_id") and d.get("is_attend") != 0:
            ids.append(int(d["customer_id"]))
    if not details:
        ids += [int(c) for c in (ls.get("customer_ids") or []) if c]
    return ids


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    try:
        days = max(1, min(60, int(params.get("days") or 14)))
    except ValueError:
        days = 14

    token = _token()
    with ThreadPoolExecutor(max_workers=2) as ex:
        f_diag = ex.submit(_done_diagnostics, token, days)
        f_reg = ex.submit(_done_regular_customers, token, days)
        lessons = f_diag.result()
        regular = f_reg.result()
    cids = sorted({cid for ls in lessons for cid in _attended_customers(ls)})

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor()
    moved = clients = 0
    try:
        if cids:
            cur.execute(f"SELECT id, name, phone FROM {SCHEMA}.crm_customers_cache "
                        f"WHERE id IN ({', '.join(str(c) for c in cids)})")
            for _cid, name, phone in cur.fetchall():
                moved += advance_lead(cur, ST_DIAG_DONE, BEFORE_DONE, phone=phone, name=name)
        clients = _mark_clients(cur, regular)
    finally:
        cur.close()
        conn.close()

    print(f"lead-funnel-sync: проведённых диагностик {len(lessons)}, учеников {len(cids)}, "
          f"сдвинуто {moved}, новых клиентов {clients}")
    return _json(200, {"ok": True, "done_lessons": len(lessons), "moved": moved + clients,
                       "clients": clients})
