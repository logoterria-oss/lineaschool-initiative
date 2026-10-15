"""
Брони расписания → «Списка лидов».

1) Ребёнок с действующей бронью (новая или подтверждённая) переводится
   в «Утверждено расписание» — даже если в брони нет телефона: тогда ищем лида
   по имени ребёнка (только если такой лид один).
2) next_lesson_at — ближайший урок: из брони или из запланированных уроков CRM.
"""
import datetime
import re
from typing import Dict, List, Optional, Tuple

import requests

from name_match import same_child

ST_SCHEDULE = 'Утверждено расписание'
BEFORE_SCHEDULE = (
    '', 'Списались в "Окне" (ответ не получен)', 'Списались в "Окне" (ответ получен)',
    'Заполнена анкета', 'Запланирована диагностика (не оплачено)',
    'Запланирована диагностика (оплачено)', 'Проведена диагностика',
)
DIAG_LESSON_TYPE = 3


def _phone10(raw) -> str:
    m = re.search(r"\+?\d[\d\s()\-]{8,}\d", str(raw or ""))
    digits = re.sub(r"\D", "", m.group(0)) if m else ""
    return digits[-10:] if len(digits) >= 10 else ""


def fetch_planned_regular(host: str, headers: dict, days: int = 14) -> List[dict]:
    """Запланированные (не диагностические) уроки CRM на ближайшие дни."""
    from concurrent.futures import ThreadPoolExecutor
    today = datetime.date.today()
    payload = {"date_from": today.isoformat(),
               "date_to": (today + datetime.timedelta(days=days)).isoformat(),
               "status": 1, "pageSize": 200}

    def page(n):
        r = requests.post(f"{host}/v2api/1/lesson/index", json={**payload, "page": n},
                          headers=headers, timeout=4)
        r.raise_for_status()
        return r.json()

    first = page(0)
    out = list(first.get("items", []))
    total = int(first.get("total") or 0)
    if out and len(out) < total:
        with ThreadPoolExecutor(max_workers=4) as ex:
            for data in ex.map(page, range(1, min(10, (total + 199) // 200))):
                out.extend(data.get("items", []))
    return [ls for ls in out
            if int(ls.get("lesson_type_id") or 0) != DIAG_LESSON_TYPE
            and "диагност" not in str(ls.get("lesson_type_name") or "").lower()]


def _when(date_raw, time_raw) -> str:
    s = str(date_raw or "").strip()
    d = None
    for fmt in ("%Y-%m-%d", "%d.%m.%Y"):
        try:
            d = datetime.datetime.strptime(s[:10], fmt).date()
            break
        except ValueError:
            continue
    if not d:
        return ""
    m = re.search(r"(\d{1,2}):(\d{2})", str(time_raw or ""))
    return f"{d.isoformat()} {int(m.group(1)):02d}:{m.group(2)}" if m else d.isoformat()


def _lesson_cids(ls: dict) -> List[int]:
    ids = []
    details = ls.get("details") if isinstance(ls.get("details"), list) else []
    for d in details:
        if isinstance(d, dict) and d.get("customer_id"):
            ids.append(int(d["customer_id"]))
    if not details:
        ids += [int(c) for c in (ls.get("customer_ids") or []) if c]
    return ids


def sync_schedule(cur, schema: str, crm_lessons: Optional[List[dict]]) -> Dict[str, int]:
    today = datetime.date.today().isoformat()

    cur.execute(
        f"SELECT b.child_name, COALESCE(NULLIF(b.phone, ''), d.phone, ''), b.slot_date, b.time_from "
        f"FROM {schema}.slot_bookings b "
        f"LEFT JOIN {schema}.interaction_dialogs d ON d.id = b.dialog_id "
        f"WHERE b.status IN ('new', 'confirmed')"
    )
    bookings: List[Tuple[str, str, str]] = []
    for child, phone, sd, tf in cur.fetchall():
        when = _when(str(sd), tf)
        bookings.append((child or "", _phone10(phone), when))

    crm_next: Dict[int, str] = {}
    for ls in crm_lessons or []:
        if int(ls.get("status") or 0) == 4:
            continue
        when = _when(ls.get("date") or ls.get("lesson_date"), ls.get("time_from"))
        if not when or when[:10] < today:
            continue
        for cid in _lesson_cids(ls):
            if cid not in crm_next or when < crm_next[cid]:
                crm_next[cid] = when
    crm_phone: Dict[str, int] = {}
    if crm_next:
        cur.execute(f"SELECT id, phone FROM {schema}.crm_customers_cache "
                    f"WHERE id IN ({', '.join(str(c) for c in crm_next)})")
        for cid, phone in cur.fetchall():
            p = _phone10(phone)
            if p:
                crm_phone[p] = cid

    cur.execute(
        f"SELECT id, contact, student_name, COALESCE(TRIM(processing_status), ''), "
        f"crm_customer_id, next_lesson_at FROM {schema}.leads "
        f"WHERE duplicate_of IS NULL AND became_client_at IS NULL "
        f"AND COALESCE(archived, FALSE) = FALSE"
    )
    leads = cur.fetchall()

    # Бронь без телефона относим к лиду по имени ребёнка — только если такой лид один
    owners: Dict[int, List[int]] = {}
    for bi, (child, bphone, _w) in enumerate(bookings):
        for lead_id, contact, student, _st, _cid, _nl in leads:
            lp = _phone10(contact)
            if bphone and lp:
                ok = bphone == lp
            else:
                ok = bool(student and child and same_child(student, child))
            if ok:
                owners.setdefault(bi, []).append(int(lead_id))
    hits_by_lead: Dict[int, List[str]] = {}
    for bi, ids in owners.items():
        if len(ids) == 1 or bookings[bi][1]:
            for lid in ids:
                hits_by_lead.setdefault(lid, []).append(bookings[bi][2])

    moved, dated = [], []
    for lead_id, contact, student, status, crm_id, cur_next in leads:
        phone = _phone10(contact)
        hits = hits_by_lead.get(int(lead_id), [])
        has_booking = bool(hits)
        future = sorted(w for w in hits if w and w[:10] >= today)
        candidates = list(future[:1])
        cid = crm_id if crm_id in crm_next else crm_phone.get(phone)
        if cid is not None:
            candidates.append(crm_next[cid])
        nxt = min(candidates) if candidates else ""
        if has_booking and status in BEFORE_SCHEDULE:
            moved.append(int(lead_id))
        if nxt != (cur_next or ""):
            dated.append((int(lead_id), nxt))

    if moved:
        ids = ", ".join(str(i) for i in moved)
        early = ", ".join("'" + s.replace("'", "''") + "'" for s in BEFORE_SCHEDULE)
        cur.execute(
            f"UPDATE {schema}.leads SET processing_status = '{ST_SCHEDULE}', "
            f"status_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP "
            f"WHERE id IN ({ids}) AND COALESCE(TRIM(processing_status), '') IN ({early})"
        )
        print(f"lead-funnel-sync: по броням в «Утверждено расписание»: {moved}")
    if dated:
        values = ", ".join(f"({i}, '{w}')" for i, w in dated)
        cur.execute(
            f"UPDATE {schema}.leads AS l SET next_lesson_at = v.w "
            f"FROM (VALUES {values}) AS v(id, w) WHERE l.id = v.id"
        )
    return {"moved": len(moved), "next_lesson": len(dated)}
