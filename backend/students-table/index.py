import os
import json
import re
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta, date

"""
Таблица учеников для кабинета администратора.
Источник: AlfaCRM S20 (статусы, занятия, абонементы) + БД заключений (speech_therapy_reports).

Диагностики берутся из CRM-уроков типа "Диагностика":
  topic = ссылка на заключение (https://lineaschool.ru/diag/{id}),
  note  = рекомендации, date = дата диагностики.
Заключение (типы дислексии/дисграфии/дизорфографии) и возраст — из speech_therapy_reports по id.
Абонемент — из customer-tariff (актуальный по e_date) + справочник tariff (название).

Режимы: GET ?mode=list | ?mode=statuses
"""

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"
SCHEMA = "t_p93118852_lineaschool_initiati"

STATUS_NAMES = {1: "Активен", 2: "Завершил", 3: "Бросил",
                4: "Каникулы (заморожен)", 5: "Каникулы"}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
    "Access-Control-Max-Age": "86400",
}


def _json(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_headers(token=None):
    h = {
        "X-APP-KEY": os.environ["S20_X_APP_KEY"],
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if token:
        h["X-ALFACRM-TOKEN"] = token
    return h


def get_token():
    url = f"{S20_HOST}/v2api/auth/login"
    resp = requests.post(url, json={
        "email": S20_EMAIL,
        "api_key": os.environ["S20_API_KEY"],
    }, headers=get_headers(), timeout=20)
    resp.raise_for_status()
    return resp.json()["token"]


def get_study_statuses(token):
    url = f"{S20_HOST}/v2api/1/study-status/index"
    resp = requests.post(url, json={"page": 0, "pageSize": 200},
                         headers=get_headers(token), timeout=20)
    resp.raise_for_status()
    return resp.json().get("items", [])


def fetch_customers_raw(token, is_study=None, removed=None):
    url = f"{S20_HOST}/v2api/1/customer/index"
    all_items = []
    page = 0
    while True:
        payload = {"page": page, "pageSize": 200}
        if is_study is not None:
            payload["is_study"] = is_study
        if removed is not None:
            payload["removed"] = removed
        resp = requests.post(url, json=payload, headers=get_headers(token), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        all_items.extend(items)
        if len(all_items) >= data.get("total", 0) or not items:
            break
        page += 1
    return all_items


def get_all_customers(token):
    seen = set()
    merged = []
    for is_study_flag, removed_flag in ((1, 0), (1, 1)):
        try:
            for it in fetch_customers_raw(token, is_study=is_study_flag, removed=removed_flag):
                cid = it.get("id")
                if cid in seen:
                    continue
                seen.add(cid)
                # Помечаем архивных: клиент из выборки removed=1 считается в архиве.
                it["_archived"] = bool(removed_flag)
                merged.append(it)
        except Exception as e:
            print(f"customers fetch failed: {e}")
    return merged


def get_lessons(token, date_from, date_to, status=3):
    url = f"{S20_HOST}/v2api/1/lesson/index"
    all_items = []
    page = 0
    while True:
        payload = {"date_from": date_from, "date_to": date_to,
                   "page": page, "pageSize": 200}
        if status is not None:
            payload["status"] = status
        resp = requests.post(url, json=payload, headers=get_headers(token), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        all_items.extend(items)
        if len(all_items) >= data.get("total", 0) or not items:
            break
        page += 1
    return all_items


def get_tariffs(token):
    """Справочник абонементов: id -> name."""
    url = f"{S20_HOST}/v2api/1/tariff/index"
    result = {}
    page = 0
    while True:
        try:
            resp = requests.post(url, json={"page": page, "pageSize": 200},
                                 headers=get_headers(token), timeout=20)
            if resp.status_code != 200:
                break
            data = resp.json()
            items = data.get("items", [])
            for t in items:
                result[t.get("id")] = t.get("name")
            if len(result) >= data.get("total", 0) or not items:
                break
            page += 1
        except Exception as e:
            print(f"tariff fetch failed: {e}")
            break
    return result


def get_customer_tariffs(token, customer_id):
    """Абонементы одного клиента (customer_id в query string)."""
    url = f"{S20_HOST}/v2api/1/customer-tariff/index?customer_id={customer_id}"
    try:
        resp = requests.post(url, json={"page": 0, "pageSize": 50},
                             headers=get_headers(token), timeout=15)
        if resp.status_code != 200:
            return []
        return resp.json().get("items", [])
    except Exception as e:
        print(f"customer-tariff failed {customer_id}: {e}")
        return []


def get_all_customer_tariffs(token, customer_ids):
    """Абонементы всех клиентов параллельно -> {customer_id: [items]}."""
    from concurrent.futures import ThreadPoolExecutor
    out = {}
    with ThreadPoolExecutor(max_workers=12) as ex:
        futures = {ex.submit(get_customer_tariffs, token, cid): cid
                   for cid in customer_ids}
        for f in futures:
            cid = futures[f]
            try:
                out[cid] = f.result()
            except Exception:
                out[cid] = []
    return out


def parse_crm_date(s):
    """CRM-даты бывают 'DD.MM.YYYY' или 'YYYY-MM-DD [HH:MM:SS]'."""
    if not s:
        return None
    s = s.strip()
    for fmt in ("%d.%m.%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:10], fmt).date()
        except ValueError:
            continue
    return None


def age_from_customer(c):
    """Возраст ученика из карточки CRM: готовое поле возраста или расчёт по дате рождения."""
    # Готовое числовое поле возраста (в AlfaCRM встречается 'age').
    for key in ("age",):
        v = c.get(key)
        if isinstance(v, (int, float)) and 0 < int(v) < 120:
            return int(v)
        if isinstance(v, str) and v.strip().isdigit():
            n = int(v.strip())
            if 0 < n < 120:
                return n
    # Дата рождения в AlfaCRM — поле 'dob' (b_date здесь = дата создания, не рождения).
    bd = parse_crm_date(c.get("dob"))
    if bd:
        today = date.today()
        n = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
        if 0 < n < 120:
            return n
    return None


def pick_actual_tariff(tariffs, tariff_names):
    """Актуальный абонемент: действует сейчас (e_date>=today), иначе последний по b_date."""
    if not tariffs:
        return None
    today = date.today()

    def label(t):
        name = tariff_names.get(t.get("tariff_id"), f"Абонемент #{t.get('tariff_id')}")
        return name

    actual = []
    for t in tariffs:
        e = parse_crm_date(t.get("e_date"))
        b = parse_crm_date(t.get("b_date"))
        actual.append((b or date.min, e, t))

    # сначала действующие
    live = [x for x in actual if x[1] is None or x[1] >= today]
    pool = live if live else actual
    pool.sort(key=lambda x: x[0], reverse=True)
    b, e, t = pool[0]
    is_live = bool(live) and (e is None or e >= today)
    return {
        "name": label(t),
        "e_date": str(e) if e else None,
        "is_active": is_live,
    }


def surname_first(name):
    """CRM хранит 'Имя Фамилия' -> возвращаем 'Фамилия Имя'.
    Имена сиблингов с союзом 'и' оставляем как есть."""
    name = (name or "").strip()
    if not name:
        return name
    parts = name.split()
    if "и" in [p.lower() for p in parts]:
        return name
    if len(parts) == 2:
        return f"{parts[1]} {parts[0]}"
    if len(parts) >= 3:
        return f"{parts[-1]} {' '.join(parts[:-1])}"
    return name


def split_siblings(name):
    """Разбивает запись сиблингов на отдельных учеников.

    'Марк и Сеня Константиновы' -> [('Константиновы Марк', True), ('Константиновы Сеня', True)].
    Для обычного клиента возвращает один элемент с флагом is_sibling=False.
    Имена соединяются союзом 'и' (или запятой), общая фамилия — последнее слово.
    """
    raw = (name or "").strip()
    if not raw:
        return [(surname_first(raw), False)]

    parts = raw.split()
    lower = [p.lower() for p in parts]
    if "и" not in lower:
        return [(surname_first(raw), False)]

    surname = parts[-1]
    # Имена — всё до фамилии, без союзов 'и' и запятых.
    given = []
    for p in parts[:-1]:
        token = p.strip(",")
        if not token or token.lower() == "и":
            continue
        given.append(token)
    if not given:
        return [(surname_first(raw), False)]

    return [(f"{surname} {g}", True) for g in given]


def lesson_customer_ids(ls):
    cids = set()
    for key in ("customer_ids", "client_ids", "student_ids"):
        for sid in (ls.get(key) or []):
            cids.add(sid)
    details = ls.get("details")
    if isinstance(details, list):
        for d in details:
            if isinstance(d, dict):
                cid = d.get("customer_id") or d.get("client_id")
                if cid is not None:
                    cids.add(cid)
    return cids


def iso_week_key(d):
    y, w, _ = d.isocalendar()
    return (y, w)


def compute_next_diag(prev_date, active_week_keys):
    """Рекомендуемая дата следующей диагностики.

    Правила:
    - База: 3 месяца чистого обучения после prev_date (≈ 13 недель занятий).
    - Полная неделя без занятий (перерыв) сдвигает дату на +7 дней.
    - Если перерыв длится 6 недель и более подряд — диагностику проводим
      сразу после перерыва (на первой неделе возобновления занятий).
    - Будущие недели (позже сегодняшней), где занятий ещё нет в расписании,
      считаем рабочими — предполагаем продолжение обучения.
    """
    base = plain_plus_3_months(prev_date)
    today_week = iso_week_key(date.today())
    diag_week = iso_week_key(prev_date)

    # Перерыв — полная завершённая неделя без занятий МЕЖДУ двумя занятиями.
    # Отсчёт начинаем с первого занятия ПОСЛЕ недели диагностики (саму неделю
    # диагностики и недели до старта обучения не штрафуем). Текущая
    # (незавершённая) неделя тоже не штрафуется.
    shift_days = 0
    gap_run = 0
    started = False
    cur = prev_date + timedelta(days=7)  # начинаем со следующей недели
    safety = 0
    while iso_week_key(cur) < today_week and safety < 520:
        safety += 1
        wk = iso_week_key(cur)
        if wk == diag_week:
            cur = cur + timedelta(days=7)
            continue
        if wk in active_week_keys:
            if started and gap_run >= 6:
                return cur
            started = True
            gap_run = 0
        elif started:
            gap_run += 1
            shift_days += 7
        cur = cur + timedelta(days=7)

    return base + timedelta(days=shift_days)


def plain_plus_3_months(prev):
    m = prev.month - 1 + 3
    y = prev.year + m // 12
    mm = m % 12 + 1
    day = min(prev.day, 28)
    return date(y, mm, day)


def build_diagnostics(diags, first_lesson_date, active_weeks, reports):
    """Список пузырьков диагностик ученика для вкладки 'Мониторинг прогресса'.

    Тип пузырька:
      - 'primary'   — первичная (первое занятие ученика само является диагностикой);
      - 'followup'  — последующие диагностики;
      - 'planned'   — запланированная (последняя диагностика + 3 месяца чистого обучения).
    Тултип:
      - первичная: ссылка на заключение (link) + рекомендации педагогу (note);
      - последующие: прогресс (topic) + рекомендации педагогу (note).
    """
    if not diags:
        return []

    ordered = sorted(diags, key=lambda d: d["date"])
    bubbles = []
    for i, d in enumerate(ordered):
        is_first_lesson_diag = (
            first_lesson_date is not None and ordered[0]["date"] == first_lesson_date
        )
        is_primary = (i == 0 and is_first_lesson_diag)
        rid = d.get("report_id")
        link = f"https://lineaschool.ru/diag/{rid}" if rid else None
        conclusion = ""
        if rid:
            rep = reports.get(rid)
            if rep:
                conclusion = rep.get("conclusion") or ""
        bubbles.append({
            "date": str(d["date"]),
            "type": "primary" if is_primary else "followup",
            "link": link,
            "conclusion": conclusion,
            "topic": d.get("topic") or "",
            "note": d.get("note") or "",
        })

    # Запланированная диагностика: последняя + 3 месяца чистого обучения.
    last_date = ordered[-1]["date"]
    if active_weeks:
        next_date = compute_next_diag(last_date, active_weeks)
    else:
        next_date = plain_plus_3_months(last_date)
    bubbles.append({
        "date": str(next_date),
        "type": "planned",
        "link": None,
        "conclusion": "",
        "topic": "",
        "note": "",
    })
    return bubbles


def extract_report_id(topic):
    """Из темы урока достаём id заключения: .../diag/{id}."""
    if not topic:
        return None
    m = re.search(r"/diag/(\d+)", topic)
    return int(m.group(1)) if m else None


def load_reports(report_ids):
    """id -> {conclusion, age, link} из speech_therapy_reports."""
    if not report_ids:
        return {}
    ids = ",".join(str(int(i)) for i in report_ids)
    conn = db()
    out = {}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT id, student_age, form_data FROM {SCHEMA}.speech_therapy_reports "
            f"WHERE id IN ({ids})"
        )
        for r in cur.fetchall():
            conclusion = ""
            age = r.get("student_age")
            fd = r.get("form_data")
            if fd:
                try:
                    data = json.loads(fd)
                    parts = []
                    for key in ("dyslexiaTypes", "dysgraphiaTypes"):
                        val = data.get(key)
                        if isinstance(val, list):
                            parts.extend([str(x).strip() for x in val if str(x).strip()])
                        elif isinstance(val, str) and val.strip():
                            parts.append(val.strip())
                    conclusion = ", ".join(parts)
                    if not age:
                        a = data.get("age")
                        age = int(a) if str(a).isdigit() else age
                except Exception as e:
                    print(f"form_data parse failed for {r['id']}: {e}")
            out[r["id"]] = {"conclusion": conclusion, "age": age}
    conn.close()
    return out


def load_overrides():
    """Ручные правки: student_id -> {conclusion, age}."""
    conn = db()
    out = {}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"SELECT student_id, conclusion, age FROM {SCHEMA}.student_overrides")
        for r in cur.fetchall():
            out[r["student_id"]] = {"conclusion": r.get("conclusion"), "age": r.get("age")}
    conn.close()
    return out


def handle_save_override(body):
    student_id = body.get("student_id")
    if not student_id:
        return _json(400, {"error": "student_id required"})

    fields = {}
    if "conclusion" in body:
        c = body.get("conclusion")
        fields["conclusion"] = c.strip() if isinstance(c, str) and c.strip() else None
    if "age" in body:
        a = body.get("age")
        try:
            fields["age"] = int(a) if a not in (None, "") else None
        except (TypeError, ValueError):
            fields["age"] = None

    if not fields:
        return _json(400, {"error": "nothing to update"})

    cols = ["student_id"] + list(fields.keys()) + ["updated_at"]
    placeholders = ["%s"] * (len(fields) + 1) + ["NOW()"]
    updates = ", ".join(f"{k} = EXCLUDED.{k}" for k in fields)
    values = [int(student_id)] + list(fields.values())

    conn = db()
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.student_overrides ({', '.join(cols)}) "
            f"VALUES ({', '.join(placeholders)}) "
            f"ON CONFLICT (student_id) DO UPDATE SET {updates}, updated_at = NOW()",
            values,
        )
        conn.commit()
    conn.close()
    return _json(200, {"success": True})


def handle_statuses(token):
    statuses = get_study_statuses(token)
    customers = get_all_customers(token)
    dist = {}
    for c in customers:
        sid = 3 if (c.get("_archived") or c.get("removed")) else c.get("study_status_id")
        dist[sid] = dist.get(sid, 0) + 1
    return _json(200, {
        "statuses": [{"id": s.get("id"), "name": s.get("name")} for s in statuses],
        "distribution": dist,
        "total_customers": len(customers),
    })


def handle_list(token, name_filter=None):
    customers = get_all_customers(token)
    tariff_names = get_tariffs(token)
    tariffs_by_customer = get_all_customer_tariffs(token, [c.get("id") for c in customers])

    today = date.today()
    date_from = "2024-01-01"
    date_to = (today + timedelta(days=1)).strftime("%Y-%m-%d")

    # Все уроки за период (все статусы) — для диагностик и для расчёта активных недель.
    try:
        all_lessons = get_lessons(token, date_from, date_to, status=None)
    except Exception as e:
        print(f"lessons fetch failed: {e}")
        all_lessons = []

    # Диагностические уроки по ученику: {cid: {date, note, report_id}}.
    diag_by_student = {}
    # Все диагностики ученика: {cid: [ {date, note, topic, report_id} ]}.
    all_diags_by_student = {}
    active_weeks_by_student = {}
    # Дата самого раннего занятия любого типа по ученику — для определения первичной диагностики.
    first_lesson_by_student = {}
    for ls in all_lessons:
        ld = parse_crm_date(ls.get("date"))
        if not ld:
            continue
        ltype = (ls.get("lesson_type_name") or "").lower()
        cids = lesson_customer_ids(ls)

        # активные недели — по любым занятиям (проведённым и запланированным),
        # кроме отменённых. Перерыв считается только если занятий не было совсем.
        if ls.get("status") != 4:  # 4 = отменён
            wk = iso_week_key(ld)
            for cid in cids:
                active_weeks_by_student.setdefault(cid, set()).add(wk)

        # самое раннее занятие любого типа
        for cid in cids:
            prev_first = first_lesson_by_student.get(cid)
            if prev_first is None or ld < prev_first:
                first_lesson_by_student[cid] = ld

        if "диагност" in ltype:
            report_id = extract_report_id(ls.get("topic"))
            for cid in cids:
                all_diags_by_student.setdefault(cid, []).append({
                    "date": ld,
                    "note": (ls.get("note") or "").strip(),
                    "topic": (ls.get("topic") or "").strip(),
                    "report_id": report_id,
                })
                prev = diag_by_student.get(cid)
                if prev is None or ld > prev["date"]:
                    diag_by_student[cid] = {
                        "date": ld,
                        "note": (ls.get("note") or "").strip(),
                        "report_id": report_id,
                    }

    # Заключения из БД для всех найденных report_id (по всем диагностикам).
    report_ids = set()
    for diags in all_diags_by_student.values():
        for d in diags:
            if d.get("report_id"):
                report_ids.add(d["report_id"])
    reports = load_reports(report_ids)
    overrides = load_overrides()

    items = []
    for c in customers:
        cid = c.get("id")
        # Архивный клиент всегда считается "Бросил" (статус 3).
        status_id = 3 if (c.get("_archived") or c.get("removed")) else c.get("study_status_id")
        diag = diag_by_student.get(cid)

        last_date = None
        next_date = None
        conclusion = ""
        age = None
        report_link = None
        recommendations = None

        if diag:
            last_date = diag["date"]
            recommendations = diag.get("note") or None
            rid = diag.get("report_id")
            if rid:
                report_link = f"https://lineaschool.ru/diag/{rid}"
                rep = reports.get(rid)
                if rep:
                    conclusion = rep.get("conclusion") or ""
                    age = rep.get("age")
            weeks = active_weeks_by_student.get(cid, set())
            if weeks:
                next_date = compute_next_diag(last_date, weeks)
            else:
                next_date = plain_plus_3_months(last_date)

        # Возраст: если из заключения нет — берём из карточки CRM (поле/дата рождения).
        if age is None:
            age = age_from_customer(c)

        # Абонемент
        tariff = pick_actual_tariff(tariffs_by_customer.get(cid, []), tariff_names)

        # Все диагностики ученика (пузырьки для 'Мониторинг прогресса').
        diagnostics = build_diagnostics(
            all_diags_by_student.get(cid, []),
            first_lesson_by_student.get(cid),
            active_weeks_by_student.get(cid, set()),
            reports,
        )

        # Сиблинги: одна CRM-запись ('Марк и Сеня Константиновы') -> несколько учеников.
        siblings = split_siblings(c.get("name"))
        for idx, (display_name, is_sibling) in enumerate(siblings):
            # Уникальный id: одиночный = cid, сиблинг = cid*1000 + (idx+1).
            row_id = cid if not is_sibling else cid * 1000 + (idx + 1)

            row_age = age
            row_conclusion = conclusion
            conclusion_manual = False
            age_manual = False

            # Ручные правки (формы нарушений, возраст) всегда в приоритете.
            ov = overrides.get(row_id)
            if ov and ov.get("conclusion") is not None:
                row_conclusion = ov["conclusion"]
                conclusion_manual = True
            if ov and ov.get("age") is not None:
                row_age = ov["age"]
                age_manual = True

            row_tariff = tariff
            if is_sibling and tariff:
                # Абонемент общий — помечаем, что он разделён между сиблингами.
                row_tariff = {**tariff, "shared_with_siblings": True}

            items.append({
                "id": row_id,
                "name": display_name,
                "status_id": status_id,
                "status_name": STATUS_NAMES.get(status_id, "—"),
                "age": row_age,
                "age_manual": age_manual,
                "conclusion": row_conclusion,
                "conclusion_manual": conclusion_manual,
                "recommendations": recommendations,
                "last_diagnostic": str(last_date) if last_date else None,
                "next_diagnostic": str(next_date) if next_date else None,
                "report_link": report_link,
                "tariff": row_tariff,
                "diagnostics": diagnostics,
            })

    items.sort(key=lambda x: (x.get("name") or "").lower())
    if name_filter:
        nf = name_filter.lower()
        items = [it for it in items if nf in (it.get("name") or "").lower()]
    return _json(200, {"items": items})


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") == "POST":
        body = json.loads(event.get("body") or "{}")
        if body.get("action") == "save_override":
            return handle_save_override(body)
        return _json(400, {"error": "unknown action"})

    params = event.get("queryStringParameters") or {}
    mode = params.get("mode", "list")

    try:
        token = get_token()
    except Exception as e:
        return _json(502, {"error": f"CRM auth error: {str(e)}"})

    if mode == "statuses":
        return handle_statuses(token)
    if mode == "list":
        return handle_list(token, params.get("q"))

    return _json(400, {"error": "unknown mode"})