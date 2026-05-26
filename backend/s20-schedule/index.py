import os
import json
import requests
from datetime import datetime, timedelta, date

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"

# Педагоги, ведущие индивидуальные занятия
INDIVIDUAL_TEACHERS = {
    2: "Анастасия Шишаева",
    18: "Анна Карамова",
    11: "Валерия Камнева",
    4: "Дарья Еремина",
}

# day из S20: 0=Вс, 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб
# weekday() Python: 0=Пн, 1=Вт, ..., 6=Вс
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


def get_lessons(token: str, date_from: str, date_to: str) -> list:
    """Получить список занятий за период"""
    url = f"{S20_HOST}/v2api/1/lesson/index"
    all_items = []
    page = 0
    while True:
        resp = requests.post(url, json={
            "date_from": date_from,
            "date_to": date_to,
            "page": page,
            "pageSize": 200,
        }, headers=get_headers(token))
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        all_items.extend(items)
        if len(all_items) >= data.get("total", 0) or not items:
            break
        page += 1
    return all_items


def get_groups(token: str) -> list:
    """Получить список активных групп"""
    url = f"{S20_HOST}/v2api/1/group/index"
    resp = requests.post(url, json={"page": 0, "pageSize": 200, "is_active": 1},
                         headers=get_headers(token))
    resp.raise_for_status()
    return resp.json().get("items", [])


def get_teachers(token: str) -> list:
    """Получить список педагогов"""
    url = f"{S20_HOST}/v2api/1/teacher/index"
    resp = requests.post(url, json={"page": 0, "pageSize": 100}, headers=get_headers(token))
    resp.raise_for_status()
    return resp.json().get("items", [])


def get_regular_lessons(token: str, teacher_ids: list) -> list:
    """Получить регулярное расписание педагогов (график работы)"""
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
    """
    Вычислить свободные слоты: регулярное расписание минус забронированные уроки.
    Возвращает список слотов, сгруппированных по дням недели.
    """
    dt_from = datetime.strptime(date_from_str, "%Y-%m-%d").date()
    dt_to = datetime.strptime(date_to_str, "%Y-%m-%d").date()
    today = date.today()

    # Собираем занятые слоты: (дата, время_начала, teacher_id)
    booked = set()
    for lesson in booked_lessons:
        if lesson.get("lesson_type_id") != 1:
            continue  # только индивидуальные
        if lesson.get("status") == 3:
            continue  # отменённые не считаем занятыми
        lesson_date = lesson.get("date", "")[:10]
        time_from = lesson.get("time_from", "")
        if "T" in time_from or " " in time_from:
            time_from = time_from.split(" ")[-1][:5] if " " in time_from else time_from.split("T")[-1][:5]
        for tid in lesson.get("teacher_ids", []):
            booked.add((lesson_date, time_from, int(tid)))

    # Строим свободные слоты по датам в диапазоне
    slots_by_weekday = {}  # weekday -> list of slot dicts

    current = dt_from
    while current <= dt_to:
        if current < today:
            current += timedelta(days=1)
            continue
        weekday = current.weekday()  # 0=Пн ... 6=Вс
        date_str = current.strftime("%Y-%m-%d")

        for rl in regular_lessons:
            teacher_id = (rl.get("teacher_ids") or [None])[0]
            if teacher_id not in INDIVIDUAL_TEACHERS:
                continue
            if rl.get("lesson_type_id") != 1:
                continue  # только индивидуальные

            # Проверяем период действия регулярного занятия
            b_date = rl.get("b_date", "")
            e_date = rl.get("e_date", "")
            if b_date and date_str < b_date:
                continue
            if e_date and date_str > e_date:
                continue

            # Проверяем день недели
            s20_day = rl.get("day")
            if s20_day is not None:
                rl_weekday = S20_DAY_TO_WEEKDAY.get(s20_day)
                if rl_weekday != weekday:
                    continue
            elif rl.get("days"):
                rl_weekdays = [S20_DAY_TO_WEEKDAY.get(d) for d in rl["days"]]
                if weekday not in rl_weekdays:
                    continue
            else:
                continue

            time_from = rl.get("time_from_v", "")
            time_to = rl.get("time_to_v", "")

            # Проверяем не занят ли слот
            if (date_str, time_from, int(teacher_id)) in booked:
                continue

            slot = {
                "date": date_str,
                "weekday": weekday,
                "weekday_name": WEEKDAY_NAMES[weekday],
                "time_from": time_from,
                "time_to": time_to,
                "teacher_id": int(teacher_id),
                "teacher_name": INDIVIDUAL_TEACHERS.get(int(teacher_id), ""),
            }

            if weekday not in slots_by_weekday:
                slots_by_weekday[weekday] = []
            slots_by_weekday[weekday].append(slot)

        current += timedelta(days=1)

    # Дедупликация по (weekday, time_from, teacher_id) — показываем уникальные слоты недели
    # Для публичного показа группируем: один слот = этот день недели доступен в это время
    unique_by_weekday = {}
    for weekday, slots in slots_by_weekday.items():
        seen = set()
        unique = []
        for s in sorted(slots, key=lambda x: x["time_from"]):
            key = (s["weekday"], s["time_from"], s["teacher_id"])
            if key not in seen:
                seen.add(key)
                unique.append(s)
        unique_by_weekday[weekday] = unique

    # Сортируем по дням недели
    result = []
    for wd in sorted(unique_by_weekday.keys()):
        result.append({
            "weekday": wd,
            "weekday_name": WEEKDAY_NAMES[wd],
            "slots": unique_by_weekday[wd],
        })

    return result


def handler(event: dict, context) -> dict:
    """Расписание S20: занятия, группы, педагоги, свободные слоты для записи"""
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    params = event.get("queryStringParameters") or {}
    mode = params.get("mode", "lessons")

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
        groups = get_groups(token)
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"groups": groups}, ensure_ascii=False),
        }

    if mode == "debug_regular":
        teacher_id = int(params.get("teacher_id", 11))
        url = f"{S20_HOST}/v2api/1/regular-lesson/index"
        resp = requests.post(url, json={"teacher_id": teacher_id, "page": 0, "pageSize": 200},
                             headers=get_headers(token))
        data = resp.json()
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"total": data.get("total"), "items": data.get("items", [])},
                               ensure_ascii=False),
        }

    if mode == "probe_work":
        # Ищем эндпоинт с рабочим графиком педагога (working hours)
        teacher_id = int(params.get("teacher_id", 11))
        results = {}
        candidates = [
            "cteacher", "teacher-work", "teacher_work_time", "work", "work_time",
            "cwork", "teacher_timetable", "staffschedule", "staff_schedule",
            "teacher_hour", "teacher_hours", "workhour", "work_hour",
        ]
        for endpoint in candidates:
            url = f"{S20_HOST}/v2api/1/{endpoint}/index"
            try:
                r = requests.post(url, json={"teacher_id": teacher_id, "page": 0, "pageSize": 5},
                                  headers=get_headers(token), timeout=5)
                results[endpoint] = r.status_code
                if r.status_code == 200:
                    results[f"{endpoint}_body"] = r.json()
            except Exception as e:
                results[endpoint] = str(e)
        # Также попробуем regular-lesson без teacher_id — посмотрим есть ли is_public=1
        url2 = f"{S20_HOST}/v2api/1/regular-lesson/index"
        r2 = requests.post(url2, json={"is_public": 1, "page": 0, "pageSize": 50},
                           headers=get_headers(token), timeout=5)
        results["regular_public"] = {"status": r2.status_code, "body": r2.json() if r2.status_code == 200 else r2.text[:200]}
        # И без привязки к ученику
        r3 = requests.post(url2, json={"related_class": None, "page": 0, "pageSize": 10},
                           headers=get_headers(token), timeout=5)
        results["regular_no_customer"] = {"status": r3.status_code, "body": r3.json() if r3.status_code == 200 else r3.text[:200]}
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(results, ensure_ascii=False),
        }

    if mode == "teachers":
        teachers = get_teachers(token)
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"teachers": teachers}, ensure_ascii=False),
        }

    if mode == "free_slots":
        # Период: следующие 4 недели
        date_to_slots = (today + timedelta(days=27)).strftime("%Y-%m-%d")
        teacher_ids = list(INDIVIDUAL_TEACHERS.keys())
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

    lessons = get_lessons(token, date_from, date_to)
    return {
        "statusCode": 200,
        "headers": {**cors_headers, "Content-Type": "application/json"},
        "body": json.dumps({
            "lessons": lessons,
            "date_from": date_from,
            "date_to": date_to,
        }, ensure_ascii=False),
    }