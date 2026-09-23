"""
Business: Автопроверки расписания для пункта 1 чек-листа администратора.
Тянет из AlfaCRM (S20) четыре среза: непроведённые уроки за вчера,
неоплаченные занятия на сегодня, наслоения у педагогов и малые группы.
Args: event с httpMethod, queryStringParameters {date: YYYY-MM-DD}
Returns: HTTP-ответ со списками находок по каждому подпункту
"""
import os
import re
import json
import datetime
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List

import requests

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}

# Служебные группы CRM — в проверки не берём
SERVICE_GROUP_PATTERNS = (
    r"^планерка\b", r"^планёрка\b", r"^тестов(ая|ый|ое|ые)\b",
    r"^тест(\b|[-_\s]|\d)", r"^test(\b|[-_\s]|\d)", r"^служебн",
)

# Статусы урока в CRM
ST_PLANNED, ST_CANCELLED, ST_DONE = 1, 2, 3


def _json(status: int, payload: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False, default=str),
    }


def _headers(token: str = None) -> dict:
    h = {
        "X-APP-KEY": os.environ["S20_X_APP_KEY"],
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if token:
        h["X-ALFACRM-TOKEN"] = token
    return h


def get_token() -> str:
    r = requests.post(
        f"{S20_HOST}/v2api/auth/login",
        json={"email": S20_EMAIL, "api_key": os.environ["S20_API_KEY"]},
        headers=_headers(), timeout=30,
    )
    r.raise_for_status()
    return r.json()["token"]


def _lessons(token: str, date_from: str, date_to: str, status=None) -> List[dict]:
    url = f"{S20_HOST}/v2api/1/lesson/index"
    out, page = [], 0
    while True:
        payload = {"date_from": date_from, "date_to": date_to, "page": page, "pageSize": 200}
        if status is not None:
            payload["status"] = status
        r = requests.post(url, json=payload, headers=_headers(token), timeout=30)
        r.raise_for_status()
        data = r.json()
        items = data.get("items", [])
        out.extend(items)
        if len(out) >= data.get("total", 0) or not items:
            break
        page += 1
    return out


def lessons_all(token: str, date_from: str, date_to: str) -> List[dict]:
    """CRM по умолчанию отдаёт только проведённые — статусы запрашиваем отдельно."""
    seen, out = set(), []

    def one(st):
        try:
            return _lessons(token, date_from, date_to, status=st)
        except Exception as e:
            print(f"lessons status={st} failed: {e}")
            return []

    with ThreadPoolExecutor(max_workers=3) as pool:
        chunks = list(pool.map(one, (None, ST_PLANNED, ST_CANCELLED)))
    for chunk in chunks:
        for ls in chunk:
            lid = ls.get("id")
            if lid in seen:
                continue
            seen.add(lid)
            out.append(ls)
    return out


def get_teachers(token: str) -> Dict[int, str]:
    r = requests.post(f"{S20_HOST}/v2api/1/teacher/index",
                      json={"page": 0, "pageSize": 200}, headers=_headers(token), timeout=30)
    r.raise_for_status()
    return {t.get("id"): (t.get("name") or "").strip() for t in r.json().get("items", [])}


def get_groups(token: str) -> Dict[int, str]:
    """Названия групп. Берём и активные, и завершённые: урок может стоять
    в группе, которую в CRM уже закрыли, — без имени строку не подписать."""
    url = f"{S20_HOST}/v2api/1/group/index"
    out: Dict[int, str] = {}
    for is_active in (1, 0):
        page = 0
        while True:
            r = requests.post(url, json={"page": page, "pageSize": 200, "is_active": is_active},
                              headers=_headers(token), timeout=30)
            r.raise_for_status()
            items = r.json().get("items", [])
            for g in items:
                gid = g.get("id")
                if gid is not None and gid not in out:
                    out[gid] = (g.get("name") or "").strip()
            if len(items) < 200:
                break
            page += 1
    return out


def get_customers(token: str) -> Dict[int, dict]:
    """Действующие ученики: имя и остаток на балансе."""
    url = f"{S20_HOST}/v2api/1/customer/index"
    out: Dict[int, dict] = {}
    for is_study, removed in ((1, 0), (0, 0), (1, 1)):
        page = 0
        while True:
            r = requests.post(url, json={"page": page, "pageSize": 200,
                                         "is_study": is_study, "removed": removed},
                              headers=_headers(token), timeout=30)
            r.raise_for_status()
            data = r.json()
            items = data.get("items", [])
            for c in items:
                cid = c.get("id")
                if cid is not None and cid not in out:
                    out[cid] = c
            if len(items) < 200 or not items:
                break
            page += 1
    return out


def _is_service(name: str) -> bool:
    s = (name or "").strip().lower().replace("ё", "е")
    if not s:
        return False
    return any(re.match(p.replace("ё", "е"), s) for p in SERVICE_GROUP_PATTERNS)


def _num(v) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _time(v: str) -> str:
    """«2026-09-23 14:00:00» / «14:00:00» → «14:00»"""
    s = str(v or "")
    if " " in s:
        s = s.split(" ")[-1]
    return s[:5]


def _minutes(hhmm: str) -> int:
    m = re.match(r"^(\d{1,2}):(\d{2})$", hhmm or "")
    return int(m.group(1)) * 60 + int(m.group(2)) if m else -1


def _group_id(ls: dict):
    g = ls.get("group_ids")
    if isinstance(g, list):
        g = g[0] if g else None
    try:
        return int(g)
    except (TypeError, ValueError):
        return None


def _details(ls: dict) -> List[dict]:
    d = ls.get("details")
    return [x for x in d if isinstance(x, dict)] if isinstance(d, list) else []


def _customer_ids(ls: dict) -> List[int]:
    """Все ученики урока: из details (группы) и из customer_ids (индивидуальные)."""
    ids, seen = [], set()
    for d in _details(ls):
        cid = d.get("customer_id") or d.get("client_id")
        if cid is not None and cid not in seen:
            seen.add(cid)
            ids.append(cid)
    for key in ("customer_ids", "client_ids", "student_ids"):
        for cid in (ls.get(key) or []):
            if cid is not None and cid not in seen:
                seen.add(cid)
                ids.append(cid)
    return ids


def _is_cancelled_detail(d: dict, lesson_status: int) -> bool:
    """Ученик снят с занятия — отмена по уважительной или неуважительной причине.

    В CRM отмена конкретного ребёнка = проставленная причина (reason_id).
    У проведённого урока дополнительно верим отметке посещаемости.
    """
    reason = d.get("reason_id")
    if reason not in (None, 0, "", "0"):
        return True
    if lesson_status == ST_DONE and d.get("is_attend") == 0:
        return True
    return False


def _lesson_title(ls: dict, groups: Dict[int, str], customers: Dict[int, dict]) -> str:
    """Чем подписать урок: названием группы или ФИО ученика — как в CRM."""
    gid = _group_id(ls)
    if gid is not None and groups.get(gid):
        return groups[gid]
    names = [_name(customers, cid) for cid in _customer_ids(ls)]
    return ", ".join(n for n in names if n) or "—"


def _name(customers: Dict[int, dict], cid) -> str:
    c = customers.get(cid) or {}
    return (c.get("name") or "").strip() or f"#{cid}"


def _skip_service(ls: dict, groups: Dict[int, str]) -> bool:
    gid = _group_id(ls)
    return gid is not None and _is_service(groups.get(gid, ""))


def _is_diagnostic(ls: dict) -> bool:
    """Диагностика — разовая услуга с отдельной оплатой, не с абонемента."""
    return "диагност" in (ls.get("lesson_type_name") or "").lower()


# ---------- подпункт «а»: не проведённые уроки за вчера ----------

def not_held_yesterday(lessons, teachers, groups, customers) -> List[dict]:
    out = []
    for ls in lessons:
        if ls.get("status") in (ST_DONE, ST_CANCELLED):
            continue
        if _skip_service(ls, groups):
            continue
        tids = [t for t in (ls.get("teacher_ids") or []) if t]
        out.append({
            "id": ls.get("id"),
            "time": _time(ls.get("time_from")),
            "teacher": teachers.get(tids[0], f"#{tids[0]}") if tids else "—",
            "title": _lesson_title(ls, groups, customers),
            "form": "индив." if ls.get("lesson_type_id") == 1 else "группа",
        })
    out.sort(key=lambda x: (x["time"], x["teacher"]))
    return out


# ---------- подпункт «б»: неоплаченные занятия сегодня ----------

def unpaid_today(lessons, teachers, groups, customers) -> List[dict]:
    """Ученик идёт сегодня на урок, а денег на балансе нет — занятие не оплачено."""
    found: Dict[Any, dict] = {}
    for ls in lessons:
        if ls.get("status") == ST_CANCELLED or _skip_service(ls, groups):
            continue
        if _is_diagnostic(ls):
            continue
        status = ls.get("status")
        cancelled, charged = set(), set()
        for d in _details(ls):
            cid = d.get("customer_id") or d.get("client_id")
            if _is_cancelled_detail(d, status):
                cancelled.add(cid)
            # Списание уже прошло — за это занятие деньги получены
            if _num(d.get("commission")) > 0:
                charged.add(cid)
        tids = [t for t in (ls.get("teacher_ids") or []) if t]
        for cid in _customer_ids(ls):
            if cid in cancelled or cid in charged or cid in found:
                continue
            c = customers.get(cid)
            if c is None:
                continue
            # Оплаченных занятий на абонементе не осталось и баланс пуст
            paid_left = _num(c.get("paid_lesson_count"))
            if paid_left > 0 or _num(c.get("balance")) > 0:
                continue
            found[cid] = {
                "id": cid,
                "name": _name(customers, cid),
                "time": _time(ls.get("time_from")),
                "teacher": teachers.get(tids[0], f"#{tids[0]}") if tids else "—",
                "title": _lesson_title(ls, groups, customers),
                "balance": round(_num(c.get("balance")), 2),
                "paid_left": int(paid_left),
            }
    out = list(found.values())
    out.sort(key=lambda x: (x["time"], x["name"]))
    return out


# ---------- подпункт «в»: наслоения в расписании ----------

def overlaps_today(lessons, teachers, groups, customers) -> List[dict]:
    """Два урока у одного педагога в одно и то же время."""
    by_teacher: Dict[int, list] = {}
    for ls in lessons:
        if ls.get("status") == ST_CANCELLED or _skip_service(ls, groups):
            continue
        t_from, t_to = _time(ls.get("time_from")), _time(ls.get("time_to"))
        start, end = _minutes(t_from), _minutes(t_to)
        if start < 0:
            continue
        if end <= start:
            end = start + 1
        for tid in (ls.get("teacher_ids") or []):
            if not tid:
                continue
            by_teacher.setdefault(tid, []).append({
                "lid": ls.get("id"), "start": start, "end": end,
                "time": t_from, "title": _lesson_title(ls, groups, customers),
            })

    out = []
    for tid, items in by_teacher.items():
        items.sort(key=lambda x: x["start"])
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                a, b = items[i], items[j]
                if b["start"] >= a["end"]:
                    break
                if a["lid"] == b["lid"]:
                    continue
                out.append({
                    "id": f"{tid}-{a['lid']}-{b['lid']}",
                    "teacher": teachers.get(tid, f"#{tid}"),
                    "time": a["time"],
                    "name": f"{teachers.get(tid, f'#{tid}')}, {a['time']}: "
                            f"«{a['title']}» и «{b['title']}»",
                })
    out.sort(key=lambda x: (x["time"], x["teacher"]))
    return out


# ---------- подпункт «г»: группы меньше 3 человек ----------

def small_groups_today(lessons, teachers, groups, customers) -> List[dict]:
    """Групповые занятия, где осталось 1-2 не отменивших ученика."""
    out = []
    for ls in lessons:
        if ls.get("status") == ST_CANCELLED or _skip_service(ls, groups):
            continue
        if ls.get("lesson_type_id") == 1:
            continue
        gid = _group_id(ls)
        if gid is None:
            continue
        status = ls.get("status")
        cancelled = {
            (d.get("customer_id") or d.get("client_id"))
            for d in _details(ls) if _is_cancelled_detail(d, status)
        }
        all_ids = _customer_ids(ls)
        active = [cid for cid in all_ids if cid not in cancelled]
        if not (1 <= len(active) <= 2):
            continue
        tids = [t for t in (ls.get("teacher_ids") or []) if t]
        out.append({
            "id": ls.get("id"),
            "time": _time(ls.get("time_from")),
            "teacher": teachers.get(tids[0], f"#{tids[0]}") if tids else "—",
            "name": f"{groups.get(gid) or f'Группа #{gid}'} — {len(active)} из {len(all_ids)}",
            "students": [_name(customers, cid) for cid in active],
            "cancelled": [_name(customers, cid) for cid in cancelled],
        })
    out.sort(key=lambda x: (x["time"], x["name"]))
    return out


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Автопроверки расписания на сегодня и вчера для чек-листа администратора"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    today = str(params.get("date") or "")[:10]
    if len(today) != 10:
        today = (datetime.datetime.now(datetime.timezone.utc)
                 + datetime.timedelta(hours=3)).strftime("%Y-%m-%d")
    try:
        d_today = datetime.date.fromisoformat(today)
    except ValueError:
        return _json(400, {"error": "bad date"})
    yesterday = (d_today - datetime.timedelta(days=1)).isoformat()

    try:
        token = get_token()
        with ThreadPoolExecutor(max_workers=5) as pool:
            f_teachers = pool.submit(get_teachers, token)
            f_groups = pool.submit(get_groups, token)
            f_customers = pool.submit(get_customers, token)
            f_yest = pool.submit(lessons_all, token, yesterday, yesterday)
            f_today = pool.submit(lessons_all, token, today, today)
            teachers = f_teachers.result()
            groups = f_groups.result()
            customers = f_customers.result()
            ls_yest = f_yest.result()
            ls_today = f_today.result()
    except Exception as e:
        return _json(502, {"error": f"CRM error: {e}"})

    return _json(200, {
        "ok": True,
        "date": today,
        "yesterday": yesterday,
        "checks": {
            "m1a": not_held_yesterday(ls_yest, teachers, groups, customers),
            "m1b": unpaid_today(ls_today, teachers, groups, customers),
            "m1c": overlaps_today(ls_today, teachers, groups, customers),
            "m1d": small_groups_today(ls_today, teachers, groups, customers),
        },
    })