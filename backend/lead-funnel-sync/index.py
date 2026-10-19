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
import time
import json
import os
from typing import Any, Dict, List

import psycopg2
import requests

from lead_funnel import (advance_lead, BEFORE_PAYMENT, ST_DIAG_PAID,
                         BEFORE_SUBSCRIPTION, ST_SUBSCRIPTION)
from diag_info import fetch_lessons, sync_diag_info, ST_PLANNED
from schedule_info import fetch_planned_regular, sync_schedule

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


def _done_regular_customers(token: str, days: int, skip: int = 0) -> set:
    today = datetime.date.today()
    payload = {"date_from": (today - datetime.timedelta(days=days)).isoformat(),
               "date_to": (today - datetime.timedelta(days=skip)).isoformat(),
               "status": ST_DONE, "pageSize": 200}

    def page(n):
        for attempt in range(4):
            r = requests.post(f"{S20_HOST}/v2api/1/lesson/index", json={**payload, "page": n},
                              headers=_headers(token), timeout=25)
            if r.status_code != 429:
                break
            time.sleep(0.6 * (attempt + 1))
        r.raise_for_status()
        return r.json()

    first = page(0)
    items = list(first.get("items", []))
    total = int(first.get("total") or 0)
    if items and len(items) < total:
        with ThreadPoolExecutor(max_workers=3) as ex:
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
        m = re.search(r"\+?\d[\d\s()\-]{8,}\d", str(contact or ""))
        digits = re.sub(r"\D", "", m.group(0)) if m else ""
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


def _catch_up_payments(cur, days: int) -> int:
    """Досверка оплат: если в момент оплаты лида не нашли (нет карточки CRM),
    двигаем его сейчас — по телефону из CRM или по ФИО."""
    cur.execute(
        f"SELECT p.plan, p.crm_name, p.name, c.phone FROM {SCHEMA}.payment_leads p "
        f"LEFT JOIN LATERAL (SELECT phone FROM {SCHEMA}.crm_customers_cache "
        f"WHERE name = p.crm_name AND phone IS NOT NULL LIMIT 1) c ON TRUE "
        f"WHERE p.paid_at IS NOT NULL AND NOT p.is_test "
        f"AND p.paid_at > NOW() - INTERVAL '{int(days)} days' ORDER BY p.paid_at"
    )
    moved = 0
    for plan, crm_name, name, phone in cur.fetchall():
        diag = "диагностик" in (plan or "").lower()
        moved += advance_lead(cur, ST_DIAG_PAID if diag else ST_SUBSCRIPTION,
                              BEFORE_PAYMENT if diag else BEFORE_SUBSCRIPTION,
                              phone=phone, name=crm_name or name)
    return moved


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
    try:
        client_days = max(days, min(1095, int(params.get("client_days") or days)))
    except ValueError:
        client_days = days
    try:
        client_skip = max(0, min(client_days - 1, int(params.get("client_skip") or 0)))
    except ValueError:
        client_skip = 0

    try:
        diag_days = max(days, min(365, int(params.get("diag_days") or 60)))
    except ValueError:
        diag_days = 60

    token = _token()
    today = datetime.date.today()
    ex = ThreadPoolExecutor(max_workers=5)
    if True:
        f_diag = ex.submit(_done_diagnostics, token, days)
        f_reg = ex.submit(_done_regular_customers, token, client_days, client_skip)
        f_plan = ex.submit(fetch_lessons, S20_HOST, _headers(token), today,
                           today + datetime.timedelta(days=60), ST_PLANNED)
        f_done = ex.submit(fetch_lessons, S20_HOST, _headers(token),
                           today - datetime.timedelta(days=diag_days), today, ST_DONE)
        f_next = ex.submit(fetch_planned_regular, S20_HOST, _headers(token))
        lessons = f_diag.result()
        regular = f_reg.result()
        try:
            next_lessons = f_next.result(timeout=2.5)
        except Exception as e:
            print(f"lead-funnel-sync: ближайшие уроки не получены: {e}")
            next_lessons = None
        try:
            planned_diag, done_diag = f_plan.result(), f_done.result()
        except Exception as e:
            print(f"lead-funnel-sync: диагностики для дат не получены: {e}")
            planned_diag, done_diag = None, None
    ex.shutdown(wait=False, cancel_futures=True)
    cids = sorted({cid for ls in lessons for cid in _attended_customers(ls)})

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor()
    moved = clients = 0
    try:
        try:
            moved += _catch_up_payments(cur, days)
        except Exception as e:
            print(f"lead-funnel-sync: досверка оплат не удалась: {e}")
        if cids:
            cur.execute(f"SELECT id, name, phone FROM {SCHEMA}.crm_customers_cache "
                        f"WHERE id IN ({', '.join(str(c) for c in cids)})")
            for _cid, name, phone in cur.fetchall():
                moved += advance_lead(cur, ST_DIAG_DONE, BEFORE_DONE, phone=phone, name=name)
        clients = _mark_clients(cur, regular)
        diag_stats = {}
        if planned_diag is not None:
            diag_stats = sync_diag_info(cur, SCHEMA, planned_diag, done_diag)
        diag_stats.update(sync_schedule(cur, SCHEMA, next_lessons))
    finally:
        cur.close()
        conn.close()

    print(f"lead-funnel-sync: проведённых диагностик {len(lessons)}, учеников {len(cids)}, "
          f"сдвинуто {moved}, новых клиентов {clients}, даты/комментарии {diag_stats}")
    return _json(200, {"ok": True, "done_lessons": len(lessons), "moved": moved + clients + sum(diag_stats.values()),
                       "clients": clients, "diag": diag_stats})