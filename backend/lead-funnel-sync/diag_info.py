"""
Даты диагностик и комментарий педагога из CRM — для карточек «Списка лидов».

- crm_diag_planned_at — ближайшая запланированная диагностика (не отменённая);
- crm_diag_done_at — последняя проведённая диагностика;
- комментарий проведённой диагностики дописываем в комментарий лида один раз
  (запоминаем id урока в crm_diag_note_lesson).
Лида с учеником CRM связываем по телефону из кэша клиентов CRM.
"""
import datetime
import re
from typing import Dict, List, Optional

import requests

ST_PLANNED = 1
ST_DONE = 3
ST_CANCELED = 4
DIAG_LESSON_TYPE = 3
DIAG_DONE_STATUS = "Проведена диагностика"


def is_diag(ls: dict) -> bool:
    return (int(ls.get("lesson_type_id") or 0) == DIAG_LESSON_TYPE
            or "диагност" in str(ls.get("lesson_type_name") or "").lower())


def _lesson_page(host: str, headers: dict, payload: dict, page: int) -> dict:
    r = requests.post(f"{host}/v2api/1/lesson/index", json={**payload, "page": page},
                      headers=headers, timeout=15)
    r.raise_for_status()
    return r.json()


def fetch_lessons(host: str, headers: dict, date_from: datetime.date, date_to: datetime.date,
                  status: Optional[int]) -> List[dict]:
    payload = {"date_from": date_from.isoformat(), "date_to": date_to.isoformat(),
               "lesson_type_id": DIAG_LESSON_TYPE, "pageSize": 200}
    if status is not None:
        payload["status"] = status
    out, page = [], 0
    while page < 20:
        data = _lesson_page(host, headers, payload, page)
        items = data.get("items", [])
        out.extend(items)
        if len(out) >= int(data.get("total") or 0) or not items:
            break
        page += 1
    return [ls for ls in out if is_diag(ls)]


def lesson_when(ls: dict) -> str:
    """'YYYY-MM-DD HH:MM' или 'YYYY-MM-DD'."""
    raw = str(ls.get("date") or ls.get("lesson_date") or "").strip()
    d = None
    for fmt in ("%Y-%m-%d", "%d.%m.%Y"):
        try:
            d = datetime.datetime.strptime(raw[:10], fmt).date()
            break
        except ValueError:
            continue
    if not d:
        return ""
    t = str(ls.get("time_from") or ls.get("time") or "").strip()
    m = re.search(r"(\d{1,2}):(\d{2})", t)
    return f"{d.isoformat()} {int(m.group(1)):02d}:{m.group(2)}" if m else d.isoformat()


def lesson_customers(ls: dict, attended_only: bool) -> List[int]:
    ids = []
    details = ls.get("details") if isinstance(ls.get("details"), list) else []
    for d in details:
        if not isinstance(d, dict) or not d.get("customer_id"):
            continue
        if attended_only and d.get("is_attend") == 0:
            continue
        ids.append(int(d["customer_id"]))
    if not details:
        ids += [int(c) for c in (ls.get("customer_ids") or []) if c]
    return ids


def _clean_note(ls: dict) -> str:
    note = str(ls.get("note") or "").strip()
    note = re.sub(r"<[^>]+>", " ", note)
    return re.sub(r"[ \t]+", " ", note).strip()


def _phone10(raw) -> str:
    m = re.search(r"\+?\d[\d\s()\-]{8,}\d", str(raw or ""))
    digits = re.sub(r"\D", "", m.group(0)) if m else ""
    return digits[-10:] if len(digits) >= 10 else ""


def sync_diag_info(cur, schema: str, planned: List[dict], done: List[dict]) -> Dict[str, int]:
    today = datetime.date.today().isoformat()
    next_plan: Dict[int, str] = {}
    for ls in planned:
        if int(ls.get("status") or 0) == ST_CANCELED:
            continue
        when = lesson_when(ls)
        if not when or when[:10] < today:
            continue
        for cid in lesson_customers(ls, attended_only=False):
            if cid not in next_plan or when < next_plan[cid]:
                next_plan[cid] = when

    last_done: Dict[int, dict] = {}
    for ls in done:
        if int(ls.get("status") or 0) != ST_DONE:
            continue
        when = lesson_when(ls)
        if not when:
            continue
        for cid in lesson_customers(ls, attended_only=True):
            if cid not in last_done or when > last_done[cid]["when"]:
                last_done[cid] = {"when": when, "id": int(ls.get("id") or 0), "note": _clean_note(ls)}

    cids = set(next_plan) | set(last_done)
    if not cids:
        return {"planned": 0, "done": 0, "notes": 0}

    cur.execute(f"SELECT id, phone FROM {schema}.crm_customers_cache "
                f"WHERE id IN ({', '.join(str(c) for c in sorted(cids))})")
    by_phone: Dict[str, int] = {}
    for cid, phone in cur.fetchall():
        p = _phone10(phone)
        if p:
            by_phone[p] = cid

    cur.execute(f"SELECT id, contact, crm_customer_id, crm_diag_planned_at, crm_diag_done_at, "
                f"crm_diag_note_lesson, COALESCE(TRIM(processing_status), '') "
                f"FROM {schema}.leads WHERE duplicate_of IS NULL")
    stats = {"planned": 0, "done": 0, "notes": 0}
    rows = []
    for lead_id, contact, crm_id, cur_plan, cur_done, note_lesson, status in cur.fetchall():
        cid = crm_id if crm_id in cids else by_phone.get(_phone10(contact))
        if cid is None:
            continue
        plan = next_plan.get(cid, "")
        new_plan = plan if plan and plan != (cur_plan or "") else None
        d = last_done.get(cid)
        new_done = d["when"] if d and d["when"] != (cur_done or "") else None
        note, lesson = None, None
        if (d and d["note"] and d["id"] and d["id"] != (note_lesson or 0)
                and status == DIAG_DONE_STATUS):
            day = datetime.date.fromisoformat(d["when"][:10]).strftime("%d.%m.%Y")
            note, lesson = f"Диагностика {day}: {d['note']}", d["id"]
        if new_plan is None and new_done is None and note is None:
            continue
        stats["planned"] += new_plan is not None
        stats["done"] += new_done is not None
        stats["notes"] += note is not None
        rows.append((int(lead_id), new_plan, new_done, note, lesson))

    if rows:
        def lit(v):
            return "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"
        values = ", ".join(
            f"({i}, {lit(p)}::text, {lit(d)}::text, {lit(n)}::text, {lit(l) if l else 'NULL'}::bigint)"
            for i, p, d, n, l in rows
        )
        cur.execute(
            f"UPDATE {schema}.leads AS l SET "
            "crm_diag_planned_at = COALESCE(v.plan, l.crm_diag_planned_at), "
            "crm_diag_done_at = COALESCE(v.done, l.crm_diag_done_at), "
            "comment = CASE WHEN v.note IS NULL THEN l.comment "
            "WHEN COALESCE(TRIM(l.comment), '') = '' THEN v.note "
            "ELSE l.comment || E'\\n\\n' || v.note END, "
            "crm_diag_note_lesson = COALESCE(v.lesson, l.crm_diag_note_lesson), "
            "updated_at = CURRENT_TIMESTAMP "
            f"FROM (VALUES {values}) AS v(id, plan, done, note, lesson) WHERE l.id = v.id"
        )
    return stats
