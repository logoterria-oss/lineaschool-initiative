import os
import re
import json
import requests
import psycopg2
from datetime import datetime, timedelta, date
from concurrent.futures import ThreadPoolExecutor

HW_START_DATE = "2026-06-01"


TEACHER_SCHEDULE_URL = "https://functions.poehali.dev/6dcf4744-e843-45cf-9614-9afe432b92f5"


def get_work_schedule_from_db() -> dict:
    """График работы педагогов из БД — через HTTP к функции teacher-schedule."""
    result = {}
    try:
        r = requests.get(TEACHER_SCHEDULE_URL, timeout=8)
        for row in r.json().get("schedule", []):
            tid = row["teacher_id"]
            result.setdefault(tid, []).append({
                "weekday": row["weekday"],
                "time_from": row["time_from"],
                "time_to": row["time_to"],
            })
    except Exception as e:
        print(f"DB error: {e}")
    return result


def get_teacher_absences_from_db() -> dict:
    """Выходные и отпуска педагогов из БД: {teacher_id: [ {kind, date_from, date_to, time_from, time_to} ]}."""
    result = {}
    try:
        r = requests.get(f"{TEACHER_SCHEDULE_URL}?resource=absences", timeout=8)
        for row in r.json().get("absences", []):
            tid = int(row["teacher_id"])
            result.setdefault(tid, []).append({
                "kind": row.get("kind"),
                "date_from": str(row.get("date_from"))[:10],
                "date_to": str(row.get("date_to"))[:10],
                "time_from": (str(row["time_from"])[:5] if row.get("time_from") else None),
                "time_to": (str(row["time_to"])[:5] if row.get("time_to") else None),
            })
    except Exception as e:
        print(f"Absences DB error: {e}")
    return result


def slot_blocked_by_absence(absences_for_teacher, date_str, tf, tt) -> bool:
    """True, если слот (date_str, tf-tt) попадает в выходной/отпуск педагога.
    Отпуск и выходной на весь день блокируют любые слоты дня.
    Выходной с интервалом времени блокирует только пересекающиеся по времени слоты."""
    for ab in absences_for_teacher or []:
        if not (ab["date_from"] <= date_str <= ab["date_to"]):
            continue
        atf = ab.get("time_from")
        att = ab.get("time_to")
        if not atf or not att:
            return True  # весь день
        # пересечение интервалов
        if atf < tt and att > tf:
            return True
    return False


def absence_covering_slot(absences_for_teacher, date_str, tf, tt):
    """Отпуск/выходной, который перекрывает слот. Возвращает саму запись или None.

    Нужен, чтобы окно педагога в отпуске не пропадало из предложений,
    а показывалось с пометкой «доступно с <дата выхода>».
    """
    for ab in absences_for_teacher or []:
        if not (ab["date_from"] <= date_str <= ab["date_to"]):
            continue
        atf = ab.get("time_from")
        att = ab.get("time_to")
        if not atf or not att:
            return ab
        if atf < tt and att > tf:
            return ab
    return None


def next_available_date(absences_for_teacher, date_str, tf, tt) -> str:
    """Первый день, начиная с date_str, когда слот уже не перекрыт отпуском."""
    try:
        cur = datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return ""
    # Ограничиваем поиск полугодом — защита от бесконечного цикла
    for _ in range(200):
        ab = absence_covering_slot(absences_for_teacher, cur.strftime("%Y-%m-%d"), tf, tt)
        if ab is None:
            return cur.strftime("%Y-%m-%d")
        try:
            cur = datetime.strptime(ab["date_to"], "%Y-%m-%d").date() + timedelta(days=1)
        except Exception:
            return ""
    return ""

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"

INDIVIDUAL_TEACHERS = {
    2: "Анастасия Шишаева",
    18: "Анна Карамова",
    11: "Валерия Камнева",
    4: "Дарья Еремина",
    20: "Екатерина Канкулова",
    15: "Екатерина Мацвей",
}

# У части педагогов номер в CRM не совпадает с номером в графике работы.
# Приводим номер из CRM к номеру графика, иначе уроки не сопоставятся с окнами.
S20_TO_LOCAL_TEACHER = {17: 20}
LOCAL_TO_S20_TEACHER = {v: k for k, v in S20_TO_LOCAL_TEACHER.items()}


def to_local_teacher(teacher_id) -> int:
    try:
        tid = int(teacher_id)
    except (TypeError, ValueError):
        return -1
    return S20_TO_LOCAL_TEACHER.get(tid, tid)


S20_DAY_TO_WEEKDAY = {1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6}
WEEKDAY_NAMES = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]


def get_headers(token: str = None) -> dict:
    h = {
        "X-APP-KEY": os.environ["S20_X_APP_KEY"],
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if token:
        h["X-ALFACRM-TOKEN"] = token
    return h


def get_token() -> str:
    """Получить токен авторизации S20 API"""
    url = f"{S20_HOST}/v2api/auth/login"
    resp = requests.post(url, json={
        "email": S20_EMAIL,
        "api_key": os.environ["S20_API_KEY"],
    }, headers=get_headers())
    resp.raise_for_status()
    return resp.json()["token"]


def get_lessons(token: str, date_from: str, date_to: str, status=None) -> list:
    """Получить список занятий за период.
    status: int (1/2/3) или list ([1,3]). None — все статусы."""
    url = f"{S20_HOST}/v2api/1/lesson/index"
    all_items = []
    page = 0
    while True:
        payload = {
            "date_from": date_from,
            "date_to": date_to,
            "page": page,
            "pageSize": 200,
        }
        if status is not None:
            # AlfaCRM ждёт целое число статуса (1=запланирован, 2=отменён, 3=проведён)
            payload["status"] = status
        resp = requests.post(url, json=payload, headers=get_headers(token))
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        all_items.extend(items)
        if len(all_items) >= data.get("total", 0) or not items:
            break
        page += 1
    return all_items


def get_lessons_all_statuses(token: str, date_from: str, date_to: str) -> list:
    """Получить занятия по всем статусам.
    S20 lesson/index по умолчанию возвращает только status=3 (проведённые).
    Чтобы получить запланированные — делаем отдельные запросы по каждому статусу и склеиваем."""
    seen = set()
    out = []

    def _one(status_arg):
        try:
            return get_lessons(token, date_from, date_to, status=status_arg)
        except Exception:
            return []

    with ThreadPoolExecutor(max_workers=3) as pool:
        chunks = list(pool.map(_one, (None, 1, 2)))
    for chunk in chunks:
        for ls in chunk:
            lid = ls.get("id")
            if lid in seen:
                continue
            seen.add(lid)
            out.append(ls)
    return out


def get_groups(token: str) -> list:
    url = f"{S20_HOST}/v2api/1/group/index"
    resp = requests.post(url, json={"page": 0, "pageSize": 200, "is_active": 1},
                         headers=get_headers(token))
    resp.raise_for_status()
    return resp.json().get("items", [])


SERVICE_GROUP_PATTERNS = (
    r"^планерка\b",
    r"^планёрка\b",
    r"^тестов(ая|ый|ое|ые)\b",
    r"^тест(\b|[-_\s]|\d)",
    r"^test(\b|[-_\s]|\d)",
    r"^служебн",
)


def _is_service_group(name: str) -> bool:
    """Служебные группы CRM («ПЛАНЕРКА», «Тестовая группа») — ученикам не показываем."""
    s = (name or "").strip().lower().replace("ё", "е")
    if not s:
        return False
    for pat in SERVICE_GROUP_PATTERNS:
        if re.match(pat.replace("ё", "е"), s):
            return True
    return False


def _parse_group_date(value: str):
    """Даты групп в S20 приходят как «DD.MM.YYYY» (иногда как ISO)."""
    if not value:
        return None
    v = str(value).strip()[:10]
    for fmt in ("%d.%m.%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(v, fmt).date()
        except Exception:
            continue
    return None


def build_group_filter(token: str) -> dict:
    """Карта group_id -> {b_date, e_date} + множество служебных групп.

    Нужна, чтобы занятие завершившейся группы («Лето …», срок до 31.08)
    не висело в расписании следующего месяца.
    """
    try:
        groups = get_groups(token)
    except Exception as e:
        print(f"groups fetch failed: {e}")
        return {"periods": {}, "service": set()}
    periods = {}
    service = set()
    for g in groups:
        gid = g.get("id")
        if gid is None:
            continue
        if _is_service_group(g.get("name") or ""):
            service.add(gid)
        periods[gid] = {
            "b_date": _parse_group_date(g.get("b_date")),
            "e_date": _parse_group_date(g.get("e_date")),
        }
    return {"periods": periods, "service": service}


def filter_lessons_by_groups(lessons: list, gfilter: dict) -> list:
    """Убираем занятия служебных групп и групп, чей период уже закончился."""
    periods = gfilter.get("periods") or {}
    service = gfilter.get("service") or set()
    if not periods and not service:
        return lessons
    out = []
    for ls in lessons:
        gids = ls.get("group_ids") or []
        if isinstance(gids, (int, str)):
            gids = [gids]
        if not gids:
            out.append(ls)
            continue
        gid = gids[0]
        try:
            gid = int(gid)
        except Exception:
            out.append(ls)
            continue
        if gid in service:
            continue
        # Группы нет среди активных в CRM (архивная/удалённая) — занятие не показываем
        if periods and gid not in periods:
            continue
        period = periods.get(gid)
        lesson_date = _parse_group_date((ls.get("date") or "")[:10])
        if period and lesson_date:
            if period["e_date"] and lesson_date > period["e_date"]:
                continue
            if period["b_date"] and lesson_date < period["b_date"]:
                continue
        out.append(ls)
    return out


def get_teachers(token: str) -> list:
    url = f"{S20_HOST}/v2api/1/teacher/index"
    resp = requests.post(url, json={"page": 0, "pageSize": 100}, headers=get_headers(token))
    resp.raise_for_status()
    return resp.json().get("items", [])


def _fetch_customers_raw(token: str, is_study=None, removed=None) -> list:
    """Получить полные карточки клиентов из S20.
    is_study: None — без фильтра, 0 — лиды, 1 — учащиеся.
    removed: None — без фильтра, 0 — активные, 1 — в архиве (ушедшие)."""
    url = f"{S20_HOST}/v2api/1/customer/index"
    all_items = []
    page = 0
    while True:
        payload = {"page": page, "pageSize": 200}
        if is_study is not None:
            payload["is_study"] = is_study
        if removed is not None:
            payload["removed"] = removed
        resp = requests.post(url, json=payload, headers=get_headers(token))
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        all_items.extend(items)
        if len(all_items) >= data.get("total", 0) or not items:
            break
        page += 1
    return all_items


def get_customers(token: str) -> list:
    """Лёгкий список клиентов: id, name, dob, is_study, study_status_id.
    Берём ВСЕХ — учеников (is_study=1), лидов (is_study=0) и ушедших (removed=1) —
    чтобы в расписании отображать имена для каждого id."""
    seen = set()
    merged = []
    # 4 прохода: активные ученики, активные лиды, ушедшие ученики, ушедшие лиды.
    # S20 по умолчанию отдаёт только активных, поэтому removed=1 обязательно.
    # Проходы идут параллельно — последовательно это самая долгая часть запроса.
    combos = ((1, 0), (0, 0), (1, 1), (0, 1))

    def _one_combo(combo):
        is_study_flag, removed_flag = combo
        try:
            return _fetch_customers_raw(token, is_study=is_study_flag, removed=removed_flag)
        except Exception as e:
            print(f"customers fetch is_study={is_study_flag} removed={removed_flag} failed: {e}")
            return []

    with ThreadPoolExecutor(max_workers=4) as pool:
        chunks = list(pool.map(_one_combo, combos))
    for chunk in chunks:
        for it in chunk:
            cid = it.get("id")
            if cid in seen:
                continue
            seen.add(cid)
            merged.append(it)
    light = []
    for it in merged:
        dob = it.get("dob") or it.get("birthday") or it.get("birth_date")
        light.append({
            "id": it.get("id"),
            "name": it.get("name"),
            "dob": dob,
            "b_date": it.get("b_date"),
            "is_study": it.get("is_study"),
            "study_status_id": it.get("study_status_id"),
            "removed": it.get("removed"),
        })
    return light


def get_regular_lessons(token: str, teacher_ids: list) -> list:
    url = f"{S20_HOST}/v2api/1/regular-lesson/index"
    all_items = []
    for teacher_id in teacher_ids:
        page = 0
        while True:
            resp = requests.post(url, json={
                "teacher_id": teacher_id,
                "page": page,
                "pageSize": 200,
            }, headers=get_headers(token))
            resp.raise_for_status()
            data = resp.json()
            items = data.get("items", [])
            all_items.extend(items)
            if len(items) < 200 or not items:
                break
            page += 1
    return all_items





def compute_free_slots(regular_lessons: list, booked_lessons: list,
                       date_from_str: str, date_to_str: str) -> list:
    dt_from = datetime.strptime(date_from_str, "%Y-%m-%d").date()
    dt_to = datetime.strptime(date_to_str, "%Y-%m-%d").date()
    today = date.today()

    work_schedule = get_work_schedule_from_db()

    # Занятость педагога считаем по ВСЕМ урокам — и индивидуальным, и групповым.
    # Группа занимает педагога целиком, поэтому этот час не может быть свободным
    # окном под индивидуальное занятие.
    regular_busy_by_weekday = {}
    for rl in regular_lessons:
        teacher_ids = [to_local_teacher(t) for t in (rl.get("teacher_ids") or []) if t is not None]
        if not any(t in INDIVIDUAL_TEACHERS for t in teacher_ids):
            continue
        time_from = rl.get("time_from_v", "")
        time_to = rl.get("time_to_v", "")
        b_date = rl.get("b_date", "")
        e_date = rl.get("e_date", "")

        weekdays = []
        s20_day = rl.get("day")
        if s20_day is not None:
            wd = S20_DAY_TO_WEEKDAY.get(s20_day)
            if wd is not None:
                weekdays.append(wd)
        elif rl.get("days"):
            for d in rl["days"]:
                wd = S20_DAY_TO_WEEKDAY.get(d)
                if wd is not None:
                    weekdays.append(wd)

        for wd in weekdays:
            for tid in teacher_ids:
                regular_busy_by_weekday.setdefault((wd, tid), []).append({
                    "time_from": time_from, "time_to": time_to,
                    "b_date": b_date, "e_date": e_date,
                })

    booked_by_date = {}
    for lesson in booked_lessons:
        if lesson.get("status") == 3:
            continue
        lesson_date = lesson.get("date", "")[:10]
        time_from = lesson.get("time_from", "")
        time_to = lesson.get("time_to", "")
        if " " in time_from:
            time_from = time_from.split(" ")[-1][:5]
        if " " in time_to:
            time_to = time_to.split(" ")[-1][:5]
        for tid in lesson.get("teacher_ids", []):
            booked_by_date.setdefault((lesson_date, to_local_teacher(tid)), []).append({
                "time_from": time_from, "time_to": time_to,
            })

    slots_by_weekday = {}
    current = dt_from
    while current <= dt_to:
        if current < today:
            current += timedelta(days=1)
            continue
        weekday = current.weekday()
        date_str = current.strftime("%Y-%m-%d")

        for teacher_id, schedule in work_schedule.items():
            if teacher_id not in INDIVIDUAL_TEACHERS:
                continue
            for slot in schedule:
                if slot["weekday"] != weekday:
                    continue
                tf = slot["time_from"]
                tt = slot["time_to"]

                is_busy = False
                for busy in regular_busy_by_weekday.get((weekday, teacher_id), []):
                    if busy.get("b_date") and date_str < busy["b_date"]:
                        continue
                    if busy.get("e_date") and date_str > busy["e_date"]:
                        continue
                    if busy["time_from"] < tt and busy["time_to"] > tf:
                        is_busy = True
                        break
                if is_busy:
                    continue

                for booked in booked_by_date.get((date_str, teacher_id), []):
                    if booked["time_from"] < tt and booked["time_to"] > tf:
                        is_busy = True
                        break
                if is_busy:
                    continue

                free_slot = {
                    "date": date_str,
                    "weekday": weekday,
                    "weekday_name": WEEKDAY_NAMES[weekday],
                    "time_from": tf,
                    "time_to": tt,
                    "teacher_id": int(teacher_id),
                    "teacher_name": INDIVIDUAL_TEACHERS.get(int(teacher_id), ""),
                }
                slots_by_weekday.setdefault(weekday, []).append(free_slot)

        current += timedelta(days=1)

    unique_by_weekday = {}
    for weekday, slots in slots_by_weekday.items():
        seen = set()
        unique = []
        for s in sorted(slots, key=lambda x: (x["time_from"], x["teacher_name"])):
            key = (s["weekday"], s["time_from"], s["teacher_id"])
            if key not in seen:
                seen.add(key)
                unique.append(s)
        unique_by_weekday[weekday] = unique

    result = []
    for wd in sorted(unique_by_weekday.keys()):
        result.append({
            "weekday": wd,
            "weekday_name": WEEKDAY_NAMES[wd],
            "slots": unique_by_weekday[wd],
        })
    return result


# Эмодзи в ФИО из CRM считаем частью имени и переносим в конец строки.
_EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF"
    "\U00002190-\U000021FF\U00002B00-\U00002BFF\U0000FE00-\U0000FE0F\U0000200D]+"
)


def _strip_emoji(name: str):
    """Возвращает (текст без эмодзи, склеенные эмодзи)."""
    emojis = "".join(_EMOJI_RE.findall(name or ""))
    text = _EMOJI_RE.sub("", name or "")
    text = re.sub(r"\s+", " ", text).strip()
    return text, emojis


def _hw_surname_first(name: str) -> str:
    """CRM хранит имена как 'Имя Фамилия'. Переворачиваем в 'Фамилия Имя'.
    Эмодзи считаем частью имени и переносим в конец: '🖐 Никита Павленко' -> 'Павленко Никита 🖐'.
    Сиблингов ('Марк и Сеня Константиновы' — общая фамилия в конце) оставляем как есть."""
    text, emojis = _strip_emoji((name or "").strip())
    if not text:
        return (name or "").strip()

    parts = text.split()
    # Составные имена сиблингов: содержат союз 'и' — фамилия уже в конце или общая
    if "и" in [p.lower() for p in parts]:
        result = text
    elif len(parts) == 2:
        result = f"{parts[1]} {parts[0]}"
    # Три и более слова без 'и' — двойное имя/фамилия: переносим последнее слово вперёд
    elif len(parts) >= 3:
        result = f"{parts[-1]} {' '.join(parts[:-1])}"
    else:
        result = text

    return f"{result} {emojis}".strip() if emojis else result


def _hw_is_test_customer(name: str) -> bool:
    """Технические карточки CRM («Тест-ученик-1») — в контроль ДЗ не берём.

    Проверяем начало имени по границе слова, чтобы настоящие фамилии
    («Тестова», «Тестоедов») остались в списке.
    """
    s = (name or "").strip().lower().replace("ё", "е")
    if not s:
        return False
    if re.match(r"^(тест|test)(\b|[-_\s]|\d)", s):
        return True
    return bool(re.match(r"^тестов(ый|ая|ое|ые)\b", s))


HW_SHORT_NAMES = {
    "алексей": ["леша", "алеша", "леха"],
    "александр": ["саша", "шура", "саня"],
    "александра": ["саша", "шура"],
    "анастасия": ["настя", "ася"],
    "анна": ["аня", "анюта"],
    "алена": ["алена", "аленка"],
    "артем": ["тема", "артемий"],
    "валентин": ["валя"],
    "валерий": ["валера"],
    "варвара": ["варя"],
    "василий": ["вася"],
    "вениамин": ["веня"],
    "вероника": ["ника"],
    "виктор": ["витя"],
    "виктория": ["вика"],
    "владимир": ["вова", "володя"],
    "владислав": ["влад", "слава"],
    "вячеслав": ["слава"],
    "григорий": ["гриша"],
    "даниил": ["даня", "данил", "данила"],
    "дарья": ["даша"],
    "дмитрий": ["дима", "митя"],
    "евгений": ["женя"],
    "евгения": ["женя"],
    "екатерина": ["катя"],
    "елена": ["лена"],
    "елизавета": ["лиза"],
    "иван": ["ваня"],
    "игорь": ["гоша"],
    "илья": ["илюша"],
    "ирина": ["ира"],
    "кирилл": ["киря"],
    "константин": ["костя"],
    "ксения": ["ксюша"],
    "лев": ["лева"],
    "макар": ["макс"],
    "максим": ["макс"],
    "маргарита": ["рита"],
    "мария": ["маша"],
    "матвей": ["мотя"],
    "михаил": ["миша"],
    "надежда": ["надя"],
    "наталья": ["наташа"],
    "никита": ["ника"],
    "николай": ["коля"],
    "олег": ["олежа"],
    "ольга": ["оля"],
    "павел": ["паша"],
    "петр": ["петя"],
    "полина": ["поля"],
    "роман": ["рома"],
    "святослав": ["слава"],
    "семен": ["сеня", "сема"],
    "сергей": ["сережа", "серега"],
    "софия": ["соня", "софья"],
    "софья": ["соня", "софия"],
    "станислав": ["стас"],
    "степан": ["стёпа", "степа"],
    "тимофей": ["тима"],
    "федор": ["федя"],
    "юрий": ["юра"],
    "яков": ["яша"],
}

# Короткое имя → полное (строится один раз из таблицы выше)
HW_SHORT_TO_FULL = {}
for _full, _shorts in HW_SHORT_NAMES.items():
    for _s in _shorts:
        HW_SHORT_TO_FULL.setdefault(_s.replace("ё", "е"), set()).add(_full)
    HW_SHORT_TO_FULL.setdefault(_full, set()).add(_full)


def _hw_lev1(a: str, b: str) -> bool:
    """Слова отличаются максимум на одну опечатку (Елизавета / Елизовета)."""
    if abs(len(a) - len(b)) > 1:
        return False
    if a == b:
        return True
    if len(a) == len(b):
        diff = sum(1 for x, y in zip(a, b) if x != y)
        return diff <= 1
    short, long = (a, b) if len(a) < len(b) else (b, a)
    i = 0
    while i < len(short) and short[i] == long[i]:
        i += 1
    return short[i:] == long[i + 1:]


def _hw_same_word(a: str, b: str) -> bool:
    """Одно и то же слово: с учётом окончаний, опечаток и коротких имён.

    Фамилии сравниваем по началу слова — так «Константинов» совпадёт
    с «Константиновы» (общая строка сиблингов), а «Моисеев» с «Моисеева».
    Имена сверяем по таблице сокращений: в контроле ДЗ пишут «Леша»,
    а в диагностике — «Алексей».
    """
    if a == b:
        return True
    # Общее начало: достаточно для склонений и множественного числа
    if len(a) >= 4 and len(b) >= 4:
        if a.startswith(b) or b.startswith(a):
            return True
    if len(a) >= 5 and len(b) >= 5 and _hw_lev1(a, b):
        return True
    fa = HW_SHORT_TO_FULL.get(a)
    fb = HW_SHORT_TO_FULL.get(b)
    if fa and fb and (fa & fb):
        return True
    return False


def _hw_name_match(want: list, have: list) -> bool:
    """Совпали ли имена ученика: нужны как минимум два общих слова.

    Два слова — это фамилия и имя. Отчество в контроле ДЗ не пишут,
    поэтому по нему не сверяем, но и не мешаем.
    """
    used = set()
    hits = 0
    for w in want:
        for i, h in enumerate(have):
            if i in used:
                continue
            if _hw_same_word(w, h):
                used.add(i)
                hits += 1
                break
    return hits >= 2


def _hw_history(params, cors_headers):
    """История отметок ДЗ по одному ученику — для отчёта в диагностике.

    Берём только из БД: в отчёт идут исключительно проставленные цвета.
    Занятия без отметки — это недоработка педагога, а не ученика,
    поэтому в CRM за расписанием не ходим (и отвечаем мгновенно).

    Имя в таблице ДЗ хранится коротко («Моисеев Леша»), а в диагностике —
    полностью («Моисеев Алексей Сергеевич»), у сиблингов — общей строкой
    («Марк и Сеня Константиновы»). Поэтому сверяем слова гибко:
    по началу слова, сокращённым именам и с поправкой на опечатку.
    """
    name = (params.get("name") or "").strip()
    if not name:
        return _hw_json(400, {"error": "Не указано имя"}, cors_headers)

    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"SELECT student_name, lesson_date, status FROM {schema}.homework_status "
        f"WHERE status <> '' ORDER BY lesson_date"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    def tokens(s):
        s = re.sub(r"[^а-яa-z\s-]", " ", (s or "").lower().replace("ё", "е"))
        return [t for t in s.split() if len(t) >= 3 and t != "лет"]

    want = tokens(name)
    if len(want) < 2:
        return _hw_json(200, {"items": []}, cors_headers)

    items = []
    for student_name, lesson_date, status in rows:
        have = tokens(student_name)
        # Совпали фамилия и имя — либо ученик входит в общую строку сиблингов
        if _hw_name_match(want, have):
            extra = [h for h in have if not any(_hw_same_word(h, w) for w in want)]
            items.append({
                "date": (lesson_date or "").strip(),
                "status": status,
                "shared": len(extra) > 0,
            })

    return _hw_json(200, {"items": items}, cors_headers)


def _hw_json(status, body, cors_headers):
    return {
        "statusCode": status,
        "headers": {**cors_headers, "Content-Type": "application/json"},
        "body": json.dumps(body, ensure_ascii=False),
    }


def _hw_save(event, cors_headers):
    """Сохранить/снять статус ДЗ по клетке."""
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    body = json.loads(event.get("body", "{}"))
    teacher_id = body.get("teacher_id")
    student_id = body.get("student_id")
    student_name = (body.get("student_name") or "").strip()
    lesson_date = (body.get("lesson_date") or "").strip()
    status = (body.get("status") or "").strip()

    if not teacher_id or not student_id or not lesson_date:
        return _hw_json(400, {"error": "Не хватает данных"}, cors_headers)
    if status not in ("green", "yellow", "red", ""):
        return _hw_json(400, {"error": "Некорректный статус"}, cors_headers)

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    if status == "":
        cur.execute(
            f"DELETE FROM {schema}.homework_status "
            f"WHERE teacher_id = %s AND student_id = %s AND lesson_date = %s",
            (int(teacher_id), int(student_id), lesson_date)
        )
    else:
        cur.execute(
            f"INSERT INTO {schema}.homework_status "
            f"(teacher_id, student_id, student_name, lesson_date, status, updated_at) "
            f"VALUES (%s, %s, %s, %s, %s, NOW()) "
            f"ON CONFLICT (teacher_id, student_id, lesson_date) "
            f"DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()",
            (int(teacher_id), int(student_id), student_name, lesson_date, status)
        )
    conn.commit()
    cur.close()
    conn.close()
    return _hw_json(200, {"success": True}, cors_headers)


HW_ALL_TEACHERS = [
    {"id": 4, "name": "Еремина Дарья"},
    {"id": 18, "name": "Карамова Анна"},
    {"id": 11, "name": "Камнева Валерия"},
    {"id": 2, "name": "Шишаева Анастасия"},
    {"id": 17, "name": "Канкулова Екатерина"},
    {"id": 15, "name": "Мацвей Екатерина"},
]


def _hw_resolve_month(params):
    """Возвращает (month, month_from, month_to, available_months). Будущие месяцы не разрешены."""
    today = date.today()
    cur_month = today.strftime("%Y-%m")
    month = (params.get("month") or cur_month)[:7]
    if month > cur_month:
        month = cur_month
    if month < HW_START_DATE[:7]:
        month = HW_START_DATE[:7]

    y, m = int(month[:4]), int(month[5:7])
    month_from = f"{month}-01"
    last_day = date(y + (1 if m == 12 else 0), 1 if m == 12 else m + 1, 1) - timedelta(days=1)
    month_to = last_day.strftime("%Y-%m-%d")

    available = []
    ym = (int(HW_START_DATE[:4]), int(HW_START_DATE[5:7]))
    while (ym[0], ym[1]) <= (today.year, today.month):
        available.append(f"{ym[0]:04d}-{ym[1]:02d}")
        ym = (ym[0] + (1 if ym[1] == 12 else 0), 1 if ym[1] == 12 else ym[1] + 1)

    return month, month_from, month_to, available


def _hw_lesson_customer_ids(ls) -> set:
    """Все id учеников из урока (индивид. — customer_ids, групп. — details[])."""
    cids = set()
    for key in ("customer_ids", "client_ids", "student_ids"):
        for sid in (ls.get(key) or []):
            cids.add(sid)
    details = ls.get("details")
    if isinstance(details, list):
        for d_item in details:
            if isinstance(d_item, dict):
                cid = d_item.get("customer_id") or d_item.get("client_id")
                if cid is not None:
                    cids.add(cid)
    return cids


def _hw_all(params, cors_headers):
    """Сводная таблица: все ученики объединены в одну строку (даже с разными педагогами).
    Один месяц (текущий или прошедший). У каждого урока — педагог и форма (групп./индив.)."""
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    today = date.today()
    today_str = today.strftime("%Y-%m-%d")

    month, month_from, month_to, available = _hw_resolve_month(params)

    try:
        token = get_token()
        lessons = get_lessons_all_statuses(token, month_from, month_to)
        lessons = filter_lessons_by_groups(lessons, build_group_filter(token))
        customers = get_customers(token)
    except Exception as e:
        return _hw_json(502, {"error": f"CRM error: {str(e)}"}, cors_headers)

    names = {c.get("id"): _hw_surname_first((c.get("name") or "").strip()) for c in customers}
    teacher_name_by_id = {t["id"]: t["name"] for t in HW_ALL_TEACHERS}
    known_ids = set(teacher_name_by_id.keys())

    # student_id -> {name, lessons: {date -> {teacher_id, teacher_name, form, is_future}}}
    rows = {}
    for ls in lessons:
        if ls.get("status") == 2:
            continue
        lesson_date = (ls.get("date") or "")[:10]
        if not lesson_date or lesson_date < month_from or lesson_date > month_to:
            continue
        is_future = lesson_date > today_str
        form = "individual" if ls.get("lesson_type_id") == 1 else "group"
        cids = _hw_lesson_customer_ids(ls)
        for tid in (ls.get("teacher_ids") or []):
            if tid not in known_ids:
                continue
            for cid in cids:
                entry = rows.setdefault(cid, {
                    "id": cid,
                    "name": names.get(cid) or f"#{cid}",
                    "lessons": {},
                })
                if lesson_date not in entry["lessons"]:
                    entry["lessons"][lesson_date] = {
                        "teacher_id": tid,
                        "teacher_name": teacher_name_by_id[tid],
                        "form": form,
                        "is_future": is_future,
                    }

    # Сохранённые статусы (ключ — педагог+ученик+дата)
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(f"SELECT teacher_id, student_id, lesson_date, status FROM {schema}.homework_status")
    saved = {(t, s, ld.strip()): st for t, s, ld, st in cur.fetchall()}
    cur.close()
    conn.close()

    students = []
    for cid, entry in rows.items():
        ldates = []
        for d in sorted(entry["lessons"].keys()):
            info = entry["lessons"][d]
            ldates.append({
                "date": d,
                "is_future": info["is_future"],
                "teacher_id": info["teacher_id"],
                "teacher_name": info["teacher_name"],
                "form": info["form"],
                "status": saved.get((info["teacher_id"], cid, d), ""),
            })
        students.append({"id": cid, "name": entry["name"], "lessons": ldates})

    # Технические карточки CRM в контроль ДЗ не показываем
    students = [s for s in students if not _hw_is_test_customer(s.get("name"))]

    students.sort(key=lambda s: s["name"].lower())

    return _hw_json(200, {"students": students, "month": month, "months": available}, cors_headers)


def _hw_table(params, cors_headers):
    """Таблица учеников педагога: даты уроков с 1 июня (проведённые + будущие) и статусы ДЗ."""
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    teacher_id = params.get("teacher_id")
    if not teacher_id:
        return _hw_json(400, {"error": "Не указан педагог"}, cors_headers)
    teacher_id = int(teacher_id)

    today = date.today()
    today_str = today.strftime("%Y-%m-%d")
    month, month_from, month_to, available = _hw_resolve_month(params)

    try:
        token = get_token()
        lessons = get_lessons_all_statuses(token, month_from, month_to)
        lessons = filter_lessons_by_groups(lessons, build_group_filter(token))
        customers = get_customers(token)
    except Exception as e:
        return _hw_json(502, {"error": f"CRM error: {str(e)}"}, cors_headers)

    names = {c.get("id"): _hw_surname_first((c.get("name") or "").strip()) for c in customers}

    students = {}
    for ls in lessons:
        if teacher_id not in (ls.get("teacher_ids") or []):
            continue
        if ls.get("status") == 2:
            continue
        lesson_date = (ls.get("date") or "")[:10]
        if not lesson_date or lesson_date < month_from or lesson_date > month_to:
            continue
        is_future = lesson_date > today_str
        cids = _hw_lesson_customer_ids(ls)
        for cid in cids:
            nm = names.get(cid) or f"#{cid}"
            entry = students.setdefault(cid, {"id": cid, "name": nm, "dates": {}})
            if lesson_date not in entry["dates"]:
                entry["dates"][lesson_date] = is_future

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"SELECT student_id, lesson_date, status FROM {schema}.homework_status WHERE teacher_id = %s",
        (teacher_id,)
    )
    saved = {(sid, ld.strip()): st for sid, ld, st in cur.fetchall()}
    cur.close()
    conn.close()

    result = []
    for entry in students.values():
        ldates = []
        for d in sorted(entry["dates"].keys()):
            ldates.append({
                "date": d,
                "is_future": entry["dates"][d],
                "status": saved.get((entry["id"], d), ""),
            })
        result.append({"id": entry["id"], "name": entry["name"], "lessons": ldates})

    # Технические карточки CRM в контроль ДЗ не показываем
    result = [s for s in result if not _hw_is_test_customer(s.get("name"))]

    result.sort(key=lambda s: s["name"].lower())
    return _hw_json(200, {"students": result, "month": month, "months": available}, cors_headers)


def handler(event: dict, context) -> dict:
    """Расписание S20: занятия, группы, педагоги, свободные слоты для записи"""
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    cors_headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    # --- Контроль ДЗ: сохранение статуса клетки (POST) ---
    if event.get("httpMethod") == "POST":
        return _hw_save(event, cors_headers)

    params = event.get("queryStringParameters") or {}
    mode = params.get("mode", "lessons")

    # --- Контроль ДЗ: таблица учеников педагога с датами уроков ---
    if mode == "hw":
        return _hw_table(params, cors_headers)

    # --- Контроль ДЗ: история отметок по одному ученику (для диагностики) ---
    if mode == "hw_history":
        return _hw_history(params, cors_headers)

    # --- Контроль ДЗ: сводная по всем педагогам ---
    if mode == "hw_all":
        return _hw_all(params, cors_headers)

    today = datetime.today()
    date_from = params.get("date_from", today.strftime("%Y-%m-%d"))
    date_to = params.get("date_to", (today + timedelta(days=13)).strftime("%Y-%m-%d"))

    try:
        token = get_token()
    except Exception as e:
        return {
            "statusCode": 502,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"error": f"S20 auth failed: {str(e)}"}, ensure_ascii=False),
        }

    if mode == "groups":
        groups = [g for g in get_groups(token) if not _is_service_group(g.get("name") or "")]
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"groups": groups}, ensure_ascii=False),
        }

    if mode == "next_group_week":
        try:
            start_dt = datetime.strptime(date_from, "%Y-%m-%d").date()
        except Exception:
            start_dt = today.date()
        monday = start_dt - timedelta(days=start_dt.weekday())
        found = None
        gfilter = build_group_filter(token)
        for week_offset in range(0, 12):
            wk_from = monday + timedelta(days=week_offset * 7)
            wk_to = wk_from + timedelta(days=5)
            try:
                lessons = get_lessons(
                    token, wk_from.strftime("%Y-%m-%d"), wk_to.strftime("%Y-%m-%d"), status=1
                )
                lessons = filter_lessons_by_groups(lessons, gfilter)
            except Exception:
                lessons = []
            has = False
            for ls in lessons:
                if ls.get("lesson_type_id") == 1:
                    continue
                has = True
                break
            if has:
                found = (wk_from, wk_to)
                break
        if found is None:
            wk_from = monday
            wk_to = monday + timedelta(days=5)
            found = (wk_from, wk_to)
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "date_from": found[0].strftime("%Y-%m-%d"),
                "date_to": found[1].strftime("%Y-%m-%d"),
                "has_lessons": found is not None,
            }, ensure_ascii=False),
        }

    if mode == "groups_week":
        MAX_GROUP_SIZE = 6
        # Все справочники S20 тянем параллельно: последовательно функция
        # не укладывается в лимит времени и страница брони получает ошибку.
        try:
            with ThreadPoolExecutor(max_workers=4) as pool:
                f_lessons = pool.submit(get_lessons_all_statuses, token, date_from, date_to)
                f_groups = pool.submit(get_groups, token)
                f_teachers = pool.submit(get_teachers, token)
                f_customers = pool.submit(get_customers, token)
                lessons = f_lessons.result()
                teachers = f_teachers.result()
                raw_groups = f_groups.result()
        except Exception as e:
            return {
                "statusCode": 502,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps({"error": f"S20 fetch failed: {str(e)}"}, ensure_ascii=False),
            }

        periods = {}
        service = set()
        group_names = {}
        for g in raw_groups:
            gid = g.get("id")
            if gid is None:
                continue
            group_names[gid] = (g.get("name") or "").strip()
            if _is_service_group(g.get("name") or ""):
                service.add(gid)
            periods[gid] = {
                "b_date": _parse_group_date(g.get("b_date")),
                "e_date": _parse_group_date(g.get("e_date")),
            }
        lessons = filter_lessons_by_groups(lessons, {"periods": periods, "service": service})

        teacher_short = {}
        for t in teachers:
            tid = t.get("id")
            full = (t.get("name") or "").strip()
            parts = full.split()
            if not parts:
                teacher_short[tid] = f"#{tid}"
            elif len(parts) == 1:
                teacher_short[tid] = parts[0]
            else:
                teacher_short[tid] = f"{parts[0]} {parts[1][0]}."

        rows: dict = {}
        # Страница брони смотрит несколько недель подряд, но ячейки строк
        # ключуются днём недели: без разбивки недели затирают друг друга.
        # Поэтому параллельно собираем те же строки отдельно по неделям —
        # так родителю хватает ОДНОГО запроса вместо четырёх.
        week_rows: dict = {}

        def _week_key(d_obj):
            try:
                base = datetime.strptime(date_from, "%Y-%m-%d").date()
            except Exception:
                return 0
            return max(0, (d_obj - base).days // 7)

        for lesson in lessons:
            # Те же правила, что в админке «Расписание → Группы»: только
            # групповые занятия, запланированные (1) и проведённые (3)
            if lesson.get("lesson_type_id") != 2:
                continue
            if lesson.get("status") not in (1, 3):
                continue

            lesson_date = (lesson.get("date") or "")[:10]
            if not lesson_date:
                continue
            try:
                d = datetime.strptime(lesson_date, "%Y-%m-%d").date()
            except Exception:
                continue
            weekday = d.weekday()
            wk = _week_key(d)

            time_from = lesson.get("time_from") or ""
            if " " in time_from:
                time_from = time_from.split(" ")[-1]
            time_from = time_from[:5]
            if not time_from:
                continue

            tids = lesson.get("teacher_ids") or []
            if not tids:
                continue
            teacher_id = int(tids[0])

            details = lesson.get("details") or []
            absent_ids = set()
            if isinstance(details, list):
                for d_item in details:
                    if isinstance(d_item, dict) and d_item.get("is_attend") == 0:
                        cid = d_item.get("customer_id") or d_item.get("client_id")
                        if cid is not None:
                            absent_ids.add(cid)
            students = set()
            for key in ("customer_ids", "client_ids", "student_ids"):
                for sid in lesson.get(key) or []:
                    if sid not in absent_ids:
                        students.add(sid)
            if isinstance(details, list):
                for d_item in details:
                    if isinstance(d_item, dict) and d_item.get("is_attend") != 0:
                        cid = d_item.get("customer_id") or d_item.get("client_id")
                        if cid is not None:
                            students.add(cid)
            enrolled = len(students)
            group_id = lesson.get("group_ids")
            if isinstance(group_id, list):
                group_id = group_id[0] if group_id else None

            # В группировку входит и сама группа: у педагога в одно время
            # могут идти две разные группы (например, «ВТ 14:00» и «ВТ 16:00»,
            # если время занятий в CRM совпало). Без group_id они склеивались
            # в одну строку, и вторая группа пропадала из расписания.
            row_key = (time_from, teacher_id, group_id)
            if row_key not in rows:
                rows[row_key] = {
                    "time": time_from,
                    "teacher_id": teacher_id,
                    "teacher_name": teacher_short.get(teacher_id, f"#{teacher_id}"),
                    "cells": {},
                    "group_id": group_id,
                    "group_name": group_names.get(group_id, ""),
                }
            cell_data = {
                "date": lesson_date,
                "enrolled": enrolled,
                "free": max(0, MAX_GROUP_SIZE - enrolled),
                "lesson_id": lesson.get("id"),
                "student_ids": sorted(students),
            }
            cell = rows[row_key]["cells"].get(weekday)
            if cell is None or enrolled > cell["enrolled"]:
                rows[row_key]["cells"][weekday] = cell_data

            wk_rows = week_rows.setdefault(wk, {})
            if row_key not in wk_rows:
                wk_rows[row_key] = {
                    "time": time_from,
                    "teacher_id": teacher_id,
                    "teacher_name": teacher_short.get(teacher_id, f"#{teacher_id}"),
                    "cells": {},
                    "group_id": group_id,
                    "group_name": group_names.get(group_id, ""),
                }
            w_cell = wk_rows[row_key]["cells"].get(weekday)
            if w_cell is None or enrolled > w_cell["enrolled"]:
                wk_rows[row_key]["cells"][weekday] = dict(cell_data)

        out_rows = [
            data
            for _, data in sorted(
                rows.items(),
                key=lambda kv: (kv[0][0], kv[1]["teacher_name"], str(kv[1].get("group_name") or "")),
            )
        ]

        # Возраст и имена учеников: возраст — чтобы показать родителю, для
        # какого возраста группа; имена — чтобы бронирование не посчитало
        # место дважды, если ребёнок из заявки уже заведён в CRM.
        ages = {}
        student_names = {}
        try:
            today_d = date.today()
            for c in f_customers.result():
                cid = c.get("id")
                name = (c.get("name") or "").strip()
                if name:
                    student_names[cid] = name
                born = _parse_group_date(c.get("dob") or "")
                if not born:
                    continue
                years = today_d.year - born.year - (
                    (today_d.month, today_d.day) < (born.month, born.day)
                )
                if 0 < years < 100:
                    ages[cid] = years
        except Exception as e:
            print(f"groups_week ages failed: {e}")

        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "max_size": MAX_GROUP_SIZE,
                "date_from": date_from,
                "date_to": date_to,
                "rows": out_rows,
                "weeks": [
                    [
                        data
                        for _, data in sorted(
                            (week_rows.get(w) or {}).items(),
                            key=lambda kv: (
                                kv[0][0],
                                kv[1]["teacher_name"],
                                str(kv[1].get("group_name") or ""),
                            ),
                        )
                    ]
                    for w in range(max(week_rows) + 1 if week_rows else 0)
                ],
                "student_ages": ages,
                "student_names": student_names,
            }, ensure_ascii=False),
        }

    if mode == "teachers":
        teachers = get_teachers(token)
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"teachers": teachers}, ensure_ascii=False),
        }

    if mode == "customers":
        try:
            customers = get_customers(token)
        except Exception as e:
            return {
                "statusCode": 502,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps({"error": f"S20 customers failed: {str(e)}"}, ensure_ascii=False),
            }
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"customers": customers}, ensure_ascii=False),
        }



    if mode == "ind_week":
        """Рабочие окна индивидуальных педагогов за конкретную неделю минус запланированные уроки.
        Возвращает: { days: [ { date, weekday, weekday_name, slots: [ { time_from, time_to, teacher_id, teacher_name, busy: bool, lesson_id? } ] } ] }
        """
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d").date()
            dt_to = datetime.strptime(date_to, "%Y-%m-%d").date()
        except Exception:
            dt_from = today.date()
            dt_to = dt_from + timedelta(days=5)

        work_schedule = get_work_schedule_from_db()
        absences = get_teacher_absences_from_db()

        # Берём запланированные (1) и проведённые (3) уроки — оба считаются занятыми
        try:
            booked_lessons = get_lessons_all_statuses(token, date_from, date_to)
            # Оставляем только status=1 и status=3 (отменённые status=2 не считаем занятыми)
            booked_lessons = [l for l in booked_lessons if l.get("status") in (1, 3)]
        except Exception:
            booked_lessons = []

        # booked_by_date[(date_str, teacher_id)] = [{time_from, time_to, lesson_id, is_group}]
        # Учитываем и индивидуальные, и групповые уроки: группа занимает педагога
        # целиком, поэтому её час не может быть свободным окном под индивидуальное.
        booked_by_date = {}
        for lesson in booked_lessons:
            is_group = lesson.get("lesson_type_id") == 2
            lesson_date = (lesson.get("date") or "")[:10]
            tf = lesson.get("time_from", "")
            tt = lesson.get("time_to", "")
            if " " in tf:
                tf = tf.split(" ")[-1][:5]
            if " " in tt:
                tt = tt.split(" ")[-1][:5]
            tf = tf[:5]
            tt = tt[:5]
            for tid in lesson.get("teacher_ids", []):
                key = (lesson_date, to_local_teacher(tid))
                booked_by_date.setdefault(key, []).append({
                    "time_from": tf, "time_to": tt,
                    "lesson_id": lesson.get("id"), "is_group": is_group,
                })

        tomorrow = today.date() + timedelta(days=1)
        days_out = []
        current = dt_from
        while current <= dt_to:
            weekday = current.weekday()
            if weekday <= 6 and current >= tomorrow:  # пн-вс, только будущие дни
                date_str = current.strftime("%Y-%m-%d")
                slots_for_day = []
                for teacher_id, schedule in work_schedule.items():
                    if teacher_id not in INDIVIDUAL_TEACHERS:
                        continue
                    for slot in schedule:
                        if slot["weekday"] != weekday:
                            continue
                        tf = slot["time_from"][:5]
                        tt = slot["time_to"][:5]
                        # Отпуск/выходной педагога. Окно не выбрасываем: отдаём его
                        # с датой выхода, чтобы предложить запись «с такого-то числа».
                        teacher_absences = absences.get(int(teacher_id))
                        covering = absence_covering_slot(teacher_absences, date_str, tf, tt)
                        available_from = None
                        if covering is not None:
                            if covering.get("kind") == "vacation":
                                available_from = next_available_date(
                                    teacher_absences, date_str, tf, tt
                                )
                                if not available_from:
                                    continue
                            else:
                                # Обычный выходной — как и раньше, окна нет
                                continue
                        # Проверяем: занят ли этот слот. Групповое занятие
                        # приоритетнее — при накладке окно точно не свободно.
                        busy = False
                        booked_lesson_id = None
                        for booked in booked_by_date.get((date_str, int(teacher_id)), []):
                            if booked["time_from"] < tt and booked["time_to"] > tf:
                                busy = True
                                booked_lesson_id = booked.get("lesson_id")
                                if booked.get("is_group"):
                                    break
                        entry = {
                            "time_from": tf,
                            "time_to": tt,
                            "teacher_id": int(teacher_id),
                            "teacher_name": INDIVIDUAL_TEACHERS.get(int(teacher_id), ""),
                            "busy": busy,
                        }
                        if booked_lesson_id:
                            entry["lesson_id"] = booked_lesson_id
                        if available_from:
                            entry["available_from"] = available_from
                        slots_for_day.append(entry)

                slots_for_day.sort(key=lambda s: (s["time_from"], s["teacher_name"]))
                if slots_for_day:
                    days_out.append({
                        "date": date_str,
                        "weekday": weekday,
                        "weekday_name": WEEKDAY_NAMES[weekday],
                        "slots": slots_for_day,
                    })
            current += timedelta(days=1)

        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"days": days_out, "date_from": date_from, "date_to": date_to}, ensure_ascii=False),
        }

    if mode == "free_slots":
        date_to_slots = (today + timedelta(days=27)).strftime("%Y-%m-%d")
        teacher_ids = [LOCAL_TO_S20_TEACHER.get(t, t) for t in INDIVIDUAL_TEACHERS]
        regular_lessons = get_regular_lessons(token, teacher_ids)
        booked_lessons = get_lessons(token, today.strftime("%Y-%m-%d"), date_to_slots)
        slots_by_weekday = compute_free_slots(
            regular_lessons, booked_lessons,
            today.strftime("%Y-%m-%d"), date_to_slots
        )
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "slots_by_weekday": slots_by_weekday,
                "teachers": INDIVIDUAL_TEACHERS,
            }, ensure_ascii=False),
        }

    # default: mode=lessons — все статусы за период
    lessons = get_lessons_all_statuses(token, date_from, date_to)
    lessons = filter_lessons_by_groups(lessons, build_group_filter(token))
    return {
        "statusCode": 200,
        "headers": {**cors_headers, "Content-Type": "application/json"},
        "body": json.dumps({
            "lessons": lessons,
            "date_from": date_from,
            "date_to": date_to,
        }, ensure_ascii=False),
    }