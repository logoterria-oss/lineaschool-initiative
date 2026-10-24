"""
Business: Автопроверки расписания для чек-листа администратора.
Тянет из AlfaCRM (S20) срезы: непроведённые уроки за вчера, неоплаченные
занятия на сегодня, наслоения у педагогов, малые группы, а также список
учеников с уроками завтра-послезавтра — для пункта «Остаток занятий».
Args: event с httpMethod, queryStringParameters {date: YYYY-MM-DD}
Returns: HTTP-ответ со списками находок по каждому подпункту
"""
import os
import re
import json
import datetime
import time
from concurrent.futures import ThreadPoolExecutor, wait
from typing import Any, Dict, List

import requests
import psycopg2

SCHEMA = "t_p93118852_lineaschool_initiati"
# Сколько минут срез CRM считается свежим: справочники меняются редко,
# ученики и уроки — чаще. Старые данные — запасной вариант, если CRM не ответила.
FRESH_MIN = {"teachers": 360, "g1": 360, "g0": 360,
             "c10": 10, "c00": 10, "c11": 10,
             "lNone": 3, "l1": 3, "l2": 3}
DEADLINE = 4.0

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


RETRY_DELAYS = (0.4, 0.8, 1.2)


def _post(url: str, payload: dict, token: str = None) -> requests.Response:
    """Запрос к CRM с повтором: на всплеск запросов CRM отвечает 429."""
    for delay in RETRY_DELAYS + (None,):
        t0 = time.time()
        r = requests.post(url, json=payload, headers=_headers(token), timeout=30)
        print(f"crm {url.rsplit('/', 2)[-2]} {payload.get('status', '')}{payload.get('is_study', '')} "
              f"p{payload.get('page')} -> {r.status_code} {time.time() - t0:.2f}s")
        if r.status_code != 429 or delay is None:
            r.raise_for_status()
            return r
        time.sleep(delay)
    return r


def get_token() -> str:
    r = requests.post(
        f"{S20_HOST}/v2api/auth/login",
        json={"email": S20_EMAIL, "api_key": os.environ["S20_API_KEY"]},
        headers=_headers(), timeout=30,
    )
    r.raise_for_status()
    return r.json()["token"]


def _pages(url: str, payload: dict, token: str) -> List[dict]:
    out, page = [], 0
    while True:
        data = _post(url, {**payload, "page": page, "pageSize": 200}, token).json()
        items = data.get("items", [])
        out.extend(items)
        if len(items) < 200 or len(out) >= data.get("total", len(out)):
            return out
        page += 1


def fetch_all(token: str, date_from: str, date_to: str):
    """Все срезы CRM разом: 9 независимых запросов параллельно.
    Последовательные цепочки не укладывались в таймаут, а 20+ одновременных
    запросов CRM отбивала ответом 429 — держим середину."""
    lesson_url = f"{S20_HOST}/v2api/1/lesson/index"
    group_url = f"{S20_HOST}/v2api/1/group/index"
    cust_url = f"{S20_HOST}/v2api/1/customer/index"
    jobs = {
        "teachers": (f"{S20_HOST}/v2api/1/teacher/index", {}),
        "g1": (group_url, {"is_active": 1}),
        "g0": (group_url, {"is_active": 0}),
        "c10": (cust_url, {"is_study": 1, "removed": 0}),
        "c00": (cust_url, {"is_study": 0, "removed": 0}),
        "c11": (cust_url, {"is_study": 1, "removed": 1}),
    }
    for st in (None, ST_PLANNED, ST_CANCELLED):
        p = {"date_from": date_from, "date_to": date_to}
        if st is not None:
            p["status"] = st
        jobs[f"l{st}"] = (lesson_url, p)

    t0 = time.time()
    rng = f"{date_from}:{date_to}"
    keys = {k: f"shiftcheck:{k}" + (f":{rng}" if k.startswith("l") else "") for k in jobs}
    cache = _cache_read(list(keys.values()))
    res: Dict[str, list] = {}
    todo = {}
    for k, ck in keys.items():
        hit = cache.get(ck)
        if hit and hit[1] < FRESH_MIN[k]:
            res[k] = hit[0]
        else:
            todo[k] = jobs[k]

    if todo:
        # Ждём CRM не дольше дедлайна: не успела — берём прошлые данные
        pool = ThreadPoolExecutor(max_workers=5)
        futures = {k: pool.submit(_pages, u, p, token) for k, (u, p) in todo.items()}
        wait(list(futures.values()), timeout=max(0.5, DEADLINE - (time.time() - t0)))
        pool.shutdown(wait=False, cancel_futures=True)
        fresh = {}
        for k, f in futures.items():
            if f.done() and f.exception() is None:
                res[k] = fresh[k] = f.result()
            elif cache.get(keys[k]):
                print(f"stale {k}")
                res[k] = cache[keys[k]][0]
            else:
                raise RuntimeError(f"CRM не ответила ({k})")
        _cache_write({keys[k]: v for k, v in fresh.items()})

    teachers = {t.get("id"): (t.get("name") or "").strip() for t in res["teachers"]}
    groups: Dict[int, str] = {}
    for g in res["g1"] + res["g0"]:
        if g.get("id") is not None and g["id"] not in groups:
            groups[g["id"]] = (g.get("name") or "").strip()
    customers: Dict[int, dict] = {}
    for c in res["c10"] + res["c00"] + res["c11"]:
        if c.get("id") is not None and c["id"] not in customers:
            customers[c["id"]] = c
    seen, lessons = set(), []
    for ls in res["lNone"] + res[f"l{ST_PLANNED}"] + res[f"l{ST_CANCELLED}"]:
        if ls.get("id") in seen:
            continue
        seen.add(ls.get("id"))
        lessons.append(ls)
    return teachers, groups, customers, lessons


def _db():
    return psycopg2.connect(os.environ["DATABASE_URL"], connect_timeout=3)


def _cache_read(keys: List[str]) -> Dict[str, tuple]:
    """Срезы CRM из кеша: {ключ: (данные, возраст в минутах)}."""
    try:
        conn = _db()
    except Exception as e:
        print(f"cache read skipped: {e}")
        return {}
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT cache_key, payload, EXTRACT(EPOCH FROM now() - updated_at) / 60 "
                f"FROM {SCHEMA}.crm_json_cache WHERE cache_key = ANY(%s)",
                (keys,),
            )
            return {k: (p if isinstance(p, list) else [], float(age)) for k, p, age in cur.fetchall()}
    except Exception as e:
        print(f"cache read failed: {e}")
        return {}
    finally:
        conn.close()


def _cache_write(items: Dict[str, list]) -> None:
    if not items:
        return
    try:
        conn = _db()
    except Exception as e:
        print(f"cache write skipped: {e}")
        return
    try:
        with conn.cursor() as cur:
            for k, v in items.items():
                cur.execute(
                    f"INSERT INTO {SCHEMA}.crm_json_cache (cache_key, payload, updated_at) "
                    f"VALUES (%s, %s::jsonb, now()) ON CONFLICT (cache_key) DO UPDATE "
                    f"SET payload = EXCLUDED.payload, updated_at = now()",
                    (k, json.dumps(v, ensure_ascii=False, default=str)),
                )
        conn.commit()
    except Exception as e:
        print(f"cache write failed: {e}")
    finally:
        conn.close()


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


# ---------- вчера «а»: не проведённые уроки ----------

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


# ---------- сегодня «а»: неоплаченные занятия ----------

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


# ---------- сегодня «б»: наслоения в расписании ----------

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


# ---------- сегодня «в»: группы меньше 3 человек ----------

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


# ---------- ближайшие уроки: завтра и послезавтра ----------

def upcoming_lessons(lessons, teachers, groups, customers, today: str) -> List[dict]:
    """Кто идёт на занятие завтра или послезавтра — по одному ближайшему уроку.

    Нужно пункту 3«б»: напоминаем об оплате тем, у кого занятия на абонементе
    закончились, а урок уже на носу. Отменённые уроки и снятых с занятия детей
    не берём — напоминать им не о чем.
    """
    found: Dict[Any, dict] = {}
    for ls in lessons:
        if ls.get("status") == ST_CANCELLED or _skip_service(ls, groups):
            continue
        if _is_diagnostic(ls):
            continue
        date = str(ls.get("date") or "")[:10]
        if not date or date <= today:
            continue
        status = ls.get("status")
        cancelled = {
            (d.get("customer_id") or d.get("client_id"))
            for d in _details(ls) if _is_cancelled_detail(d, status)
        }
        tids = [t for t in (ls.get("teacher_ids") or []) if t]
        for cid in _customer_ids(ls):
            if cid in cancelled:
                continue
            item = {
                "customer_id": cid,
                "name": _name(customers, cid),
                "date": date,
                "time": _time(ls.get("time_from")),
                "teacher": teachers.get(tids[0], f"#{tids[0]}") if tids else "—",
                "title": _lesson_title(ls, groups, customers),
            }
            prev = found.get(cid)
            if prev is None or (item["date"], item["time"]) < (prev["date"], prev["time"]):
                found[cid] = item
    out = list(found.values())
    out.sort(key=lambda x: (x["date"], x["time"], x["name"]))
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
    tomorrow = (d_today + datetime.timedelta(days=1)).isoformat()
    day_after = (d_today + datetime.timedelta(days=2)).isoformat()

    # Проверка делается раз в день и хранится для всех: первый, кто открыл
    # дашборд утром, запускает её, остальные видят сохранённый результат.
    # refresh=1 — перепроверить по кнопке.
    day_key = f"daily_checks:{today}"
    if params.get("refresh") != "1":
        saved = _cache_read([day_key]).get(day_key)
        if saved and saved[0]:
            return _json(200, saved[0][0])

    try:
        token = get_token()
        # Уроки за все четыре дня берём одним диапазоном и делим по датам
        teachers, groups, customers, lessons = fetch_all(token, yesterday, day_after)
    except Exception as e:
        print(f"CRM error: {e}")
        return _json(502, {"error": f"CRM error: {e}"})

    def on(*days):
        return [ls for ls in lessons if str(ls.get("date") or "")[:10] in days]

    ls_yest, ls_today, ls_next = on(yesterday), on(today), on(tomorrow, day_after)

    msk_now = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=3)
    result = {
        "ok": True,
        "checked_at": msk_now.strftime("%H:%M"),
        "date": today,
        "yesterday": yesterday,
        "checks": {
            # Пункт 1 «Вчерашний день»
            "m1a": not_held_yesterday(ls_yest, teachers, groups, customers),
            # Пункт 2 «Расписание на сегодня»
            "m2a": unpaid_today(ls_today, teachers, groups, customers),
            "m2b": overlaps_today(ls_today, teachers, groups, customers),
            "m2c": small_groups_today(ls_today, teachers, groups, customers),
        },
        # Пункт 3 «Остаток занятий»: кто идёт на урок завтра-послезавтра.
        # Остаток занятий фронт берёт из таблицы учеников — там он считается
        # ровно так же, как в разделе «Список учеников».
        "upcoming": upcoming_lessons(ls_next, teachers, groups, customers, today),
    }
    # Кэш хранит списки — кладём результат дня одним элементом
    _cache_write({day_key: [result]})
    return _json(200, result)