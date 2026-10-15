"""
Business: Сверка воронки лидов с CRM — диагностики, отмеченные «Проведено»,
переводят лида в «Проведена диагностика». Лида находим по телефону ученика
из кэша клиентов CRM, а без телефона — по ФИО (если совпадение одно).
Args: event с httpMethod (GET), queryStringParameters {days: глубина, по умолчанию 14}
Returns: {ok, done_lessons, moved}
"""
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

    lessons = _done_diagnostics(_token(), days)
    cids = sorted({cid for ls in lessons for cid in _attended_customers(ls)})
    if not cids:
        return _json(200, {"ok": True, "done_lessons": len(lessons), "moved": 0})

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor()
    moved = 0
    try:
        cur.execute(f"SELECT id, name, phone FROM {SCHEMA}.crm_customers_cache "
                    f"WHERE id IN ({', '.join(str(c) for c in cids)})")
        for _cid, name, phone in cur.fetchall():
            moved += advance_lead(cur, ST_DIAG_DONE, BEFORE_DONE, phone=phone, name=name)
    finally:
        cur.close()
        conn.close()

    print(f"lead-funnel-sync: проведённых диагностик {len(lessons)}, учеников {len(cids)}, сдвинуто {moved}")
    return _json(200, {"ok": True, "done_lessons": len(lessons), "moved": moved})
