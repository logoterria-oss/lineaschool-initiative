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


# Исполнители комментариев (администраторы CRM). Каждому — свой цвет для наглядности.
# При необходимости список пополняется здесь.
ADMINS = [
    {"id": 1, "name": "Абраменко Виктория", "color": "#7c3aed"},
    {"id": 2, "name": "Федорова Анастасия", "color": "#0d9488"},
    {"id": 3, "name": "Зинченко Ирина", "color": "#db2777"},
]


def get_crm_admins(token=None):
    """Список исполнителей (администраторов) для выбора в комментариях."""
    return ADMINS


def load_comments():
    """Комментарии администраторов по ученикам: {student_id: [ {...} ]}."""
    out = {}
    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT id, student_id, executor_id, executor_name, comment_date, "
            f"done, parent_reply, extra FROM {SCHEMA}.student_comments "
            f"ORDER BY comment_date DESC NULLS LAST, id DESC"
        )
        for r in cur.fetchall():
            out.setdefault(r["student_id"], []).append({
                "id": r["id"],
                "executor_id": r["executor_id"],
                "executor_name": r["executor_name"],
                "comment_date": r["comment_date"],
                "done": r["done"] or "",
                "parent_reply": r["parent_reply"] or "",
                "extra": r["extra"] or "",
            })
    conn.close()
    return out


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
    """Занятия за период.

    Страниц много (несколько тысяч занятий с 2024 года), и CRM отвечает
    примерно секунду на каждую. Последовательный обход занимал ~15 секунд,
    поэтому первую страницу берём отдельно — из неё узнаём total,
    а остальные тянем параллельно.
    """
    from concurrent.futures import ThreadPoolExecutor

    url = f"{S20_HOST}/v2api/1/lesson/index"
    page_size = 200

    def fetch_page(page):
        payload = {"date_from": date_from, "date_to": date_to,
                   "page": page, "pageSize": page_size}
        if status is not None:
            payload["status"] = status
        resp = requests.post(url, json=payload, headers=get_headers(token), timeout=30)
        resp.raise_for_status()
        return resp.json()

    first = fetch_page(0)
    all_items = first.get("items", [])
    total = first.get("total", 0)
    if not all_items or len(all_items) >= total:
        return all_items

    last_page = (total + page_size - 1) // page_size
    pages = list(range(1, last_page))
    if not pages:
        return all_items

    with ThreadPoolExecutor(max_workers=8) as ex:
        for data in ex.map(fetch_page, pages):
            all_items.extend(data.get("items", []))
    return all_items


def get_tariffs(token):
    """Справочник абонементов: id -> {name, price, lessons_count}."""
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
                result[t.get("id")] = {
                    "name": t.get("name"),
                    "price": t.get("price"),
                    "lessons_count": t.get("lessons_count"),
                }
            if len(result) >= data.get("total", 0) or not items:
                break
            page += 1
        except Exception as e:
            print(f"tariff fetch failed: {e}")
            break
    return result


def get_customer_tariffs(token, customer_id):
    """Все абонементы клиента: активные + архивные (removed не фильтруем)."""
    url = f"{S20_HOST}/v2api/1/customer-tariff/index?customer_id={customer_id}"
    all_items = []
    page = 0
    while True:
        try:
            resp = requests.post(url, json={"page": page, "pageSize": 100},
                                 headers=get_headers(token), timeout=15)
            if resp.status_code != 200:
                break
            data = resp.json()
            items = data.get("items", [])
            all_items.extend(items)
            if len(all_items) >= data.get("total", 0) or not items:
                break
            page += 1
        except Exception as e:
            print(f"customer-tariff failed {customer_id}: {e}")
            break
    return all_items


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


def _to_float(v):
    try:
        return float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return 0.0


def pick_actual_tariff(tariffs, tariff_dict, balance):
    """Актуальный абонемент. Название и e_date — по последнему абонементу.

    Остаток оплаченных занятий считаем сами:
        остаток = floor( деньги_на_балансе / цена_одного_занятия ),
    где цена_одного_занятия = price_абонемента / lessons_count_абонемента
    из справочника тарифов. Цену берём по ПОСЛЕДНЕМУ (текущему) абонементу.

    - "актуален" (is_active=True), если остаток > 0 — денег хватает хотя бы
      на одно занятие (даже если абонемент в архиве/завершён по дате);
    - "закончен" (is_active=False), если денег не хватает ни на одно занятие.
    """
    if not tariffs:
        return None

    def label(tid):
        info = tariff_dict.get(tid)
        return (info or {}).get("name") or f"Абонемент #{tid}"

    # Последний абонемент по дате начала.
    actual = []
    for t in tariffs:
        e = parse_crm_date(t.get("e_date"))
        b = parse_crm_date(t.get("b_date"))
        actual.append((b or date.min, e, t))
    actual.sort(key=lambda x: x[0], reverse=True)
    b, e, t = actual[0]
    tid = t.get("tariff_id")

    # Цена одного занятия по последнему абонементу.
    info = tariff_dict.get(tid) or {}
    price = _to_float(info.get("price"))
    lessons = _to_float(info.get("lessons_count"))
    lesson_price = (price / lessons) if (price > 0 and lessons > 0) else 0

    money = _to_float(balance)
    paid_left = int(money // lesson_price) if lesson_price > 0 else 0

    return {
        "name": label(tid),
        "e_date": str(e) if e else None,
        "is_active": paid_left > 0,
        "paid_lessons_left": paid_left,
    }


# Эмодзи в ФИО из CRM считаем частью имени и переносим в конец строки.
_EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF"
    "\U00002190-\U000021FF\U00002B00-\U00002BFF\U0000FE00-\U0000FE0F\U0000200D]+"
)


def surname_first(name):
    """CRM хранит 'Имя Фамилия' -> возвращаем 'Фамилия Имя'.
    Эмодзи считаем частью имени и переносим в конец: '🖐 Никита Павленко' -> 'Павленко Никита 🖐'.
    Имена сиблингов с союзом 'и' оставляем как есть."""
    src = (name or "").strip()
    emojis = "".join(_EMOJI_RE.findall(src))
    text = re.sub(r"\s+", " ", _EMOJI_RE.sub("", src)).strip()
    if not text:
        return src

    parts = text.split()
    if "и" in [p.lower() for p in parts]:
        result = text
    elif len(parts) == 2:
        result = f"{parts[1]} {parts[0]}"
    elif len(parts) >= 3:
        result = f"{parts[-1]} {' '.join(parts[:-1])}"
    else:
        result = text

    return f"{result} {emojis}".strip() if emojis else result


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
    # Нет ни одной диагностики: планируем от первого занятия в CRM по тому же
    # принципу (3 месяца чистого обучения). Первое занятие — это точка старта
    # отсчёта (как «предыдущая диагностика»).
    if not diags:
        if first_lesson_date is None:
            return []
        if active_weeks:
            next_date = compute_next_diag(first_lesson_date, active_weeks)
        else:
            next_date = plain_plus_3_months(first_lesson_date)
        return [{
            "date": str(next_date),
            "type": "planned",
            "link": None,
            "conclusion": "",
            "topic": "",
            "note": "",
        }]

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
    """Ручные правки: student_id -> {conclusion, age, interaction_ok}."""
    conn = db()
    out = {}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT student_id, conclusion, age, interaction_ok "
            f"FROM {SCHEMA}.student_overrides"
        )
        for r in cur.fetchall():
            out[r["student_id"]] = {
                "conclusion": r.get("conclusion"),
                "age": r.get("age"),
                "interaction_ok": r.get("interaction_ok"),
            }
    conn.close()
    return out


def _name_key(name):
    """Ключ для сопоставления ФИО: фамилия + имя, без отчества и регистра.

    В CRM и в анкете ФИО пишут по-разному (лишние пробелы, «ё», отчество
    то есть, то нет), поэтому сравниваем по двум первым словам.
    """
    s = (name or "").lower().replace("ё", "е")
    s = re.sub(r"[^а-яa-z\s-]", " ", s)
    parts = [p for p in s.split() if p]
    return " ".join(parts[:2])


def load_cities():
    """Город и часовой пояс из анкет родителей: {ключ ФИО: {city, timezone}}.

    Берём последнюю по времени анкету ребёнка: родитель мог заполнить
    анкету повторно и указать новый населённый пункт после переезда.
    """
    out = {}
    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT child_name, city, city_timezone "
            f"FROM {SCHEMA}.parent_questionnaire "
            f"WHERE city IS NOT NULL AND city <> '' "
            f"ORDER BY created_at ASC"
        )
        for r in cur.fetchall():
            key = _name_key(r.get("child_name"))
            if not key:
                continue
            out[key] = {
                "city": (r.get("city") or "").strip(),
                "timezone": (r.get("city_timezone") or "").strip(),
            }
    conn.close()
    return out


def load_interactions():
    """Взаимодействия по ученикам: {student_id: [ {..., replies:[...]} ]}."""
    out = {}
    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT id, student_id, request_source, request_date, request_text, done, done_text, admin_comment "
            f"FROM {SCHEMA}.student_interactions "
            f"ORDER BY request_date DESC NULLS LAST, id DESC"
        )
        rows = cur.fetchall()
        by_id = {}
        for r in rows:
            item = {
                "id": r["id"],
                "request_source": r["request_source"] or "parent",
                "request_date": str(r["request_date"]) if r["request_date"] else None,
                "request_text": r["request_text"] or "",
                "done": bool(r["done"]),
                "done_text": r["done_text"] or "",
                "admin_comment": r["admin_comment"] or "",
                "replies": [],
            }
            by_id[r["id"]] = item
            out.setdefault(r["student_id"], []).append(item)
        if by_id:
            cur.execute(
                f"SELECT id, interaction_id, reply_source, reply_date, reply_text "
                f"FROM {SCHEMA}.student_interaction_replies "
                f"WHERE interaction_id = ANY(%s) "
                f"ORDER BY reply_date ASC NULLS LAST, id ASC",
                (list(by_id.keys()),)
            )
            for r in cur.fetchall():
                parent = by_id.get(r["interaction_id"])
                if parent is not None:
                    parent["replies"].append({
                        "id": r["id"],
                        "reply_source": r["reply_source"] or "parent",
                        "reply_date": str(r["reply_date"]) if r["reply_date"] else None,
                        "reply_text": r["reply_text"] or "",
                    })
    conn.close()
    return out


# date_from/date_to в таблице NOT NULL, поэтому "пустую" дату храним сентинелом.
SENTINEL_DATE = "1900-01-01"


def _date_in(v):
    """None/'' -> сентинел (для записи в NOT NULL колонку)."""
    return v if v else SENTINEL_DATE


def _date_out(v):
    """Сентинел/None -> None, иначе строка даты."""
    if not v:
        return None
    s = str(v)
    return None if s == SENTINEL_DATE else s


def load_vacations():
    """Каникулы: {student_id: {id, date_from, date_to, vacation_end_type,
                               first_lesson_date, first_lesson_status, note}}.
    Берём последнюю актуальную запись по student_id (date_to >= today или NULL).
    """
    conn = db()
    out = {}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"SELECT DISTINCT ON (student_id) id, student_id, date_from, date_to, "
            f"  vacation_end_type, first_lesson_date, first_lesson_status, note "
            f"FROM {SCHEMA}.student_vacations "
            f"ORDER BY student_id, date_from DESC"
        )
        for r in cur.fetchall():
            sid = r["student_id"]
            out[sid] = {
                "id": r["id"],
                "date_from": _date_out(r["date_from"]),
                "date_to": _date_out(r["date_to"]),
                "vacation_end_type": r["vacation_end_type"] or "exact",
                "first_lesson_date": _date_out(r["first_lesson_date"]),
                "first_lesson_status": r["first_lesson_status"] or "not_agreed",
                "note": r["note"] or "",
            }
    conn.close()
    return out


def handle_save_vacation(body):
    """Upsert записи каникул для ученика.

    Поля: student_id (обязательно), date_from, date_to, vacation_end_type,
    first_lesson_date, first_lesson_status, note.
    Если запись для student_id уже есть — обновляем, иначе создаём.
    """
    student_id = body.get("student_id")
    if not student_id:
        return _json(400, {"error": "student_id required"})
    # Значения для вставки новой записи (если записи ещё нет).
    date_from = _date_in(body.get("date_from"))
    date_to = _date_in(body.get("date_to"))
    vacation_end_type = body.get("vacation_end_type", "exact")
    first_lesson_date = body.get("first_lesson_date") or None
    first_lesson_status = body.get("first_lesson_status", "not_agreed")
    note = body.get("note", "")

    # Для UPDATE обновляем ТОЛЬКО те поля, которые реально переданы в запросе,
    # чтобы редактирование одного поля не затирало остальные.
    update_map = {
        "date_from": _date_in(body["date_from"]) if "date_from" in body else None,
        "date_to": _date_in(body["date_to"]) if "date_to" in body else None,
        "vacation_end_type": body.get("vacation_end_type") if "vacation_end_type" in body else None,
        "first_lesson_date": (body.get("first_lesson_date") or None) if "first_lesson_date" in body else None,
        "first_lesson_status": body.get("first_lesson_status") if "first_lesson_status" in body else None,
        "note": body.get("note") if "note" in body else None,
    }
    set_parts = ["updated_at=NOW()"]
    set_vals = []
    for col in ("date_from", "date_to", "vacation_end_type",
                "first_lesson_date", "first_lesson_status", "note"):
        if col in body:
            set_parts.append(f"{col}=%s")
            set_vals.append(update_map[col])
    conn = db()
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.student_vacations "
            f"(student_id, date_from, date_to, vacation_end_type, first_lesson_date, first_lesson_status, note) "
            f"VALUES (%s,%s,%s,%s,%s,%s,%s) "
            f"ON CONFLICT (student_id) DO UPDATE SET " + ", ".join(set_parts),
            (int(student_id), date_from, date_to, vacation_end_type,
             first_lesson_date, first_lesson_status, note, *set_vals)
        )
        conn.commit()
    conn.close()
    return _json(200, {"success": True})


def handle_delete_vacation(body):
    """Удалить запись каникул по id."""
    vac_id = body.get("id")
    if not vac_id:
        return _json(400, {"error": "id required"})
    conn = db()
    with conn.cursor() as cur:
        cur.execute(f"DELETE FROM {SCHEMA}.student_vacations WHERE id=%s", (int(vac_id),))
        conn.commit()
    conn.close()
    return _json(200, {"success": True})


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


def handle_save_comment(body):
    """Создать или обновить комментарий администратора по ученику."""
    student_id = body.get("student_id")
    if not student_id:
        return _json(400, {"error": "student_id required"})
    comment_id = body.get("id")
    executor_id = body.get("executor_id")
    try:
        executor_id = int(executor_id) if executor_id not in (None, "") else None
    except (TypeError, ValueError):
        executor_id = None
    executor_name = (body.get("executor_name") or "").strip() or None
    comment_date = _date_in(body.get("comment_date"))
    done = (body.get("done") or "").strip()
    parent_reply = (body.get("parent_reply") or "").strip()
    extra = (body.get("extra") or "").strip()

    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if comment_id:
            cur.execute(
                f"UPDATE {SCHEMA}.student_comments SET "
                f"executor_id=%s, executor_name=%s, comment_date=%s, "
                f"done=%s, parent_reply=%s, extra=%s, updated_at=NOW() "
                f"WHERE id=%s RETURNING id",
                (executor_id, executor_name, comment_date, done,
                 parent_reply, extra, int(comment_id))
            )
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.student_comments "
                f"(student_id, executor_id, executor_name, comment_date, done, parent_reply, extra) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (int(student_id), executor_id, executor_name, comment_date,
                 done, parent_reply, extra)
            )
        new_id = cur.fetchone()["id"]
        conn.commit()
    conn.close()
    return _json(200, {"success": True, "id": new_id})


def handle_delete_comment(body):
    """Удалить комментарий по id."""
    comment_id = body.get("id")
    if not comment_id:
        return _json(400, {"error": "id required"})
    conn = db()
    with conn.cursor() as cur:
        cur.execute(f"DELETE FROM {SCHEMA}.student_comments WHERE id=%s", (int(comment_id),))
        conn.commit()
    conn.close()
    return _json(200, {"success": True})


_SRC_ALLOWED = ("parent", "teacher", "admin")


def _src(v):
    v = (v or "").strip()
    return v if v in _SRC_ALLOWED else "parent"


def handle_save_interaction(body):
    """Создать или обновить взаимодействие с учеником вместе с ответами.

    Поля: student_id, id(опц.), request_source, request_date, request_text,
    done(bool), replies:[{reply_source, reply_date, reply_text}].
    """
    student_id = body.get("student_id")
    if not student_id:
        return _json(400, {"error": "student_id required"})
    interaction_id = body.get("id")
    request_source = _src(body.get("request_source"))
    request_date = body.get("request_date") or None
    request_text = (body.get("request_text") or "").strip()
    done = bool(body.get("done"))
    done_text = (body.get("done_text") or "").strip()
    admin_comment = (body.get("admin_comment") or "").strip()
    replies = body.get("replies") or []

    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if interaction_id:
            cur.execute(
                f"UPDATE {SCHEMA}.student_interactions SET "
                f"request_source=%s, request_date=%s, request_text=%s, done=%s, done_text=%s, admin_comment=%s, updated_at=NOW() "
                f"WHERE id=%s RETURNING id",
                (request_source, request_date, request_text, done, done_text, admin_comment, int(interaction_id))
            )
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.student_interactions "
                f"(student_id, request_source, request_date, request_text, done, done_text, admin_comment) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (int(student_id), request_source, request_date, request_text, done, done_text, admin_comment)
            )
        new_id = cur.fetchone()["id"]

        # Ответы пересобираем полностью (проще и надёжнее для UI).
        cur.execute(
            f"DELETE FROM {SCHEMA}.student_interaction_replies WHERE interaction_id=%s",
            (new_id,)
        )
        saved_replies = []
        for rep in replies:
            r_src = _src(rep.get("reply_source"))
            r_date = rep.get("reply_date") or None
            r_text = (rep.get("reply_text") or "").strip()
            if not r_text and not r_date:
                continue
            cur.execute(
                f"INSERT INTO {SCHEMA}.student_interaction_replies "
                f"(interaction_id, reply_source, reply_date, reply_text) "
                f"VALUES (%s,%s,%s,%s) RETURNING id",
                (new_id, r_src, r_date, r_text)
            )
            rid = cur.fetchone()["id"]
            saved_replies.append({
                "id": rid, "reply_source": r_src,
                "reply_date": r_date, "reply_text": r_text,
            })
        conn.commit()
    conn.close()
    return _json(200, {"success": True, "id": new_id, "replies": saved_replies})


def handle_delete_interaction(body):
    """Удалить взаимодействие вместе с ответами."""
    iid = body.get("id")
    if not iid:
        return _json(400, {"error": "id required"})
    conn = db()
    with conn.cursor() as cur:
        cur.execute(
            f"DELETE FROM {SCHEMA}.student_interaction_replies WHERE interaction_id=%s",
            (int(iid),)
        )
        cur.execute(
            f"DELETE FROM {SCHEMA}.student_interactions WHERE id=%s", (int(iid),)
        )
        conn.commit()
    conn.close()
    return _json(200, {"success": True})


def handle_set_interaction_ok(body):
    """Ручной статус ок/не ок по ученику (student_overrides.interaction_ok)."""
    student_id = body.get("student_id")
    if not student_id:
        return _json(400, {"error": "student_id required"})
    ok = body.get("ok")
    ok = None if ok is None else bool(ok)
    conn = db()
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.student_overrides (student_id, interaction_ok, updated_at) "
            f"VALUES (%s,%s,NOW()) "
            f"ON CONFLICT (student_id) DO UPDATE SET interaction_ok=EXCLUDED.interaction_ok, updated_at=NOW()",
            (int(student_id), ok)
        )
        conn.commit()
    conn.close()
    return _json(200, {"success": True})


def handle_admins():
    """Список администраторов для выбора исполнителя комментария."""
    return _json(200, {"admins": get_crm_admins()})


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
    from concurrent.futures import ThreadPoolExecutor

    today = date.today()
    date_from = "2024-01-01"
    date_to = (today + timedelta(days=1)).strftime("%Y-%m-%d")

    # Занятия, справочники и данные из БД друг от друга не зависят —
    # тянем одновременно, а не по очереди. Единственная зависимость:
    # абонементы клиентов нужно запрашивать по списку клиентов,
    # поэтому эта задача ждёт список внутри своего потока.
    def load_lessons():
        try:
            return get_lessons(token, date_from, date_to, status=None)
        except Exception as e:
            print(f"lessons fetch failed: {e}")
            return []

    with ThreadPoolExecutor(max_workers=7) as ex:
        f_customers = ex.submit(get_all_customers, token)
        f_lessons = ex.submit(load_lessons)
        f_tariff_names = ex.submit(get_tariffs, token)
        f_overrides = ex.submit(load_overrides)
        f_vacations = ex.submit(load_vacations)
        f_comments = ex.submit(load_comments)
        f_interactions = ex.submit(load_interactions)
        f_cities = ex.submit(load_cities)

        customers = f_customers.result()
        tariffs_by_customer = get_all_customer_tariffs(
            token, [c.get("id") for c in customers]
        )
        all_lessons = f_lessons.result()
        tariff_names = f_tariff_names.result()
        overrides = f_overrides.result()
        vacations = f_vacations.result()
        comments = f_comments.result()
        interactions = f_interactions.result()
        cities = f_cities.result()

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
    # report_ids известны только после разбора занятий, поэтому
    # заключения догружаем здесь; остальное уже загружено выше параллельно.
    reports = load_reports(report_ids)

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

            # Заключение (форма нарушения) берём ТОЛЬКО из первичной диагностики —
            # самой ранней по дате диагностики ученика.
            primary = None
            student_diags = all_diags_by_student.get(cid, [])
            if student_diags:
                primary = min(student_diags, key=lambda x: x["date"])
            p_rid = primary.get("report_id") if primary else None
            if p_rid:
                report_link = f"https://lineaschool.ru/diag/{p_rid}"
                rep = reports.get(p_rid)
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

        # Абонемент. Остаток занятий = баланс / цена занятия по последнему абонементу.
        tariff = pick_actual_tariff(
            tariffs_by_customer.get(cid, []), tariff_names, c.get("balance"))

        # Все диагностики ученика (пузырьки для 'Мониторинг прогресса').
        diagnostics = build_diagnostics(
            all_diags_by_student.get(cid, []),
            first_lesson_by_student.get(cid),
            active_weeks_by_student.get(cid, set()),
            reports,
        )

        # Нет диагностик, но есть запланированная от первого занятия —
        # используем её как дату следующей диагностики.
        if next_date is None:
            planned = next((d for d in diagnostics if d["type"] == "planned"), None)
            if planned:
                next_date = planned["date"]

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

            # Населённый пункт и часовой пояс — из анкеты родителя,
            # сопоставление по ФИО ребёнка (в CRM отдельного поля города нет).
            city_info = cities.get(_name_key(display_name)) or {}

            items.append({
                "id": row_id,
                "name": display_name,
                "city": city_info.get("city") or "",
                "city_timezone": city_info.get("timezone") or "",
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
                "vacation": vacations.get(row_id) or vacations.get(cid),
                "comments": comments.get(row_id) or comments.get(cid) or [],
                "interactions": interactions.get(row_id) or interactions.get(cid) or [],
                "interaction_ok": ov.get("interaction_ok") if ov else None,
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
        action = body.get("action")
        if action == "save_override":
            return handle_save_override(body)
        if action == "save_vacation":
            return handle_save_vacation(body)
        if action == "delete_vacation":
            return handle_delete_vacation(body)
        if action == "save_comment":
            return handle_save_comment(body)
        if action == "delete_comment":
            return handle_delete_comment(body)
        if action == "save_interaction":
            return handle_save_interaction(body)
        if action == "delete_interaction":
            return handle_delete_interaction(body)
        if action == "set_interaction_ok":
            return handle_set_interaction_ok(body)
        return _json(400, {"error": "unknown action"})

    params = event.get("queryStringParameters") or {}
    mode = params.get("mode", "list")

    if mode == "admins":
        return handle_admins()

    try:
        token = get_token()
    except Exception as e:
        return _json(502, {"error": f"CRM auth error: {str(e)}"})

    if mode == "statuses":
        return handle_statuses(token)
    if mode == "list":
        return handle_list(token, params.get("q"))
    return _json(400, {"error": "unknown mode"})