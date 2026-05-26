import os
import json
import requests
from datetime import datetime, timedelta, date


def get_work_schedule_from_db() -> dict:
    """График работы педагогов из БД — через HTTP к функции teacher-schedule."""
    result = {}
    try:
        url = "https://functions.poehali.dev/6dcf4744-e843-45cf-9614-9afe432b92f5"
        r = requests.get(url, timeout=8)
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


def _time_in_range(t: str, t_from: str, t_to: str) -> bool:
    """Проверка попадает ли время t (HH:MM) в полуинтервал [t_from, t_to)"""
    return t_from <= t < t_to


def compute_free_slots(regular_lessons: list, booked_lessons: list,
                       date_from_str: str, date_to_str: str) -> list:
    """
    Вычислить свободные слоты:
    - База — график работы из БД (teacher_work_schedule)
    - Минус регулярные уроки из S20 (regular-lesson) — постоянные занятия
    - Минус разовые занятия (lesson) из S20 на конкретные даты
    """
    dt_from = datetime.strptime(date_from_str, "%Y-%m-%d").date()
    dt_to = datetime.strptime(date_to_str, "%Y-%m-%d").date()
    today = date.today()

    # 1. График работы из нашей БД
    work_schedule = get_work_schedule_from_db()  # {teacher_id: [{weekday, time_from, time_to}]}

    # 2. Регулярные занятия из S20: (weekday, teacher_id) -> set of "HH:MM" (час начала занятий)
    regular_busy_by_weekday = {}  # (weekday, teacher_id) -> [(time_from, time_to)]
    for rl in regular_lessons:
        teacher_id = (rl.get("teacher_ids") or [None])[0]
        if teacher_id not in INDIVIDUAL_TEACHERS:
            continue
        if rl.get("lesson_type_id") != 1:
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
            regular_busy_by_weekday.setdefault((wd, int(teacher_id)), []).append({
                "time_from": time_from, "time_to": time_to,
                "b_date": b_date, "e_date": e_date,
            })

    # 3. Разовые занятия из S20: (date, teacher_id) -> [(time_from, time_to)]
    booked_by_date = {}
    for lesson in booked_lessons:
        if lesson.get("lesson_type_id") != 1:
            continue
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
            booked_by_date.setdefault((lesson_date, int(tid)), []).append({
                "time_from": time_from, "time_to": time_to,
            })

    # 4. Строим свободные слоты, проходя по дням
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

                # Проверяем регулярные занятия педагога в этот день недели
                is_busy = False
                for busy in regular_busy_by_weekday.get((weekday, teacher_id), []):
                    if busy.get("b_date") and date_str < busy["b_date"]:
                        continue
                    if busy.get("e_date") and date_str > busy["e_date"]:
                        continue
                    # Пересечение интервалов: занят, если start_busy < tt и end_busy > tf
                    if busy["time_from"] < tt and busy["time_to"] > tf:
                        is_busy = True
                        break
                if is_busy:
                    continue

                # Проверяем разовые занятия на эту дату
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

    # Дедупликация по (weekday, time_from, teacher_id) — уникальные окна по дню недели
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


def handler(event: dict, context) -> dict:
    """Расписание S20: занятия, группы (групповые слоты по неделям v2), педагоги, свободные слоты для записи"""
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

    if mode == "groups_week":
        # Таблица групповых занятий за неделю
        # Строки: (time_from + teacher_id), колонки: дни недели (0..5 Пн..Сб)
        # Ячейка: свободные места = MAX_GROUP_SIZE - уникальных учеников на этом lesson
        MAX_GROUP_SIZE = 6
        try:
            lessons = get_lessons(token, date_from, date_to)
            teachers = get_teachers(token)
        except Exception as e:
            return {
                "statusCode": 502,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps({"error": f"S20 fetch failed: {str(e)}"}, ensure_ascii=False),
            }

        # teacher_id -> "Фамилия И."
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

        # Группировка занятий: key = (time_from, teacher_id) -> {weekday: {"date","enrolled","lesson_id"}}
        rows: dict = {}
        for lesson in lessons:
            # только групповые: lesson_type_id == 2 (group) или 3
            ltype = lesson.get("lesson_type_id")
            if ltype == 1:
                continue
            # status: 1=запланирован, 2=отменён, 3=проведён — все три показываем

            lesson_date = (lesson.get("date") or "")[:10]
            if not lesson_date:
                continue
            try:
                d = datetime.strptime(lesson_date, "%Y-%m-%d").date()
            except Exception:
                continue
            weekday = d.weekday()
            if weekday > 5:
                continue  # пропускаем воскресенье

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

            # уникальные ученики (поля customer_ids / client_ids / details)
            students = set()
            for key in ("customer_ids", "client_ids", "student_ids"):
                for sid in lesson.get(key) or []:
                    students.add(sid)
            details = lesson.get("details") or []
            if isinstance(details, list):
                for d_item in details:
                    if isinstance(d_item, dict):
                        cid = d_item.get("customer_id") or d_item.get("client_id")
                        if cid is not None:
                            students.add(cid)
            enrolled = len(students)
            group_id = lesson.get("group_ids")
            if isinstance(group_id, list):
                group_id = group_id[0] if group_id else None

            row_key = (time_from, teacher_id)
            if row_key not in rows:
                rows[row_key] = {
                    "time": time_from,
                    "teacher_id": teacher_id,
                    "teacher_name": teacher_short.get(teacher_id, f"#{teacher_id}"),
                    "cells": {},
                    "group_id": group_id,
                }
            cell = rows[row_key]["cells"].get(weekday)
            if cell is None or enrolled > cell["enrolled"]:
                rows[row_key]["cells"][weekday] = {
                    "date": lesson_date,
                    "enrolled": enrolled,
                    "free": max(0, MAX_GROUP_SIZE - enrolled),
                    "lesson_id": lesson.get("id"),
                }

        # сортируем строки: по времени, потом по педагогу
        out_rows = []
        for (time_from, teacher_id), data in sorted(rows.items(), key=lambda kv: (kv[0][0], kv[1]["teacher_name"])):
            out_rows.append(data)

        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "max_size": MAX_GROUP_SIZE,
                "date_from": date_from,
                "date_to": date_to,
                "rows": out_rows,
            }, ensure_ascii=False),
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
        # Большой брутфорс
        teacher_id = int(params.get("teacher_id", 2))
        results = {}
        names = [
            "teacher-schedule", "schedule", "teacher-calendar", "calendar",
            "teacher-work", "teacher-working", "working-hours", "work-hours",
            "teacher-hour", "teacher-hours", "teacher-time", "teacher-times",
            "grafik", "graphic", "tgrafik",
            "work-day", "work-days", "workday", "workdays",
            "teacher-day", "teacher-days",
            "available-time", "available", "availability",
            "teacher-availability", "teacher-free",
            "free-slot", "free-slots", "freeslot",
            "ctgraph", "ct-graph", "ctt-graph",
            "tgraph", "wgraph",
            "teacher-grafik", "teacher_grafik",
            "settings", "calendar-settings", "branch-settings",
            "config", "calendar-config",
            "shift", "shifts", "duty", "roster",
            "rabochee-vremya", "rabochee_vremya",
        ]
        prefixes = ["/v2api/1/", "/v2api/"]
        for prefix in prefixes:
            for name in names:
                path = f"{prefix}{name}/index"
                url = f"{S20_HOST}{path}"
                try:
                    r = requests.post(url, json={"teacher_id": teacher_id, "page": 0, "pageSize": 5},
                                      headers=get_headers(token), timeout=3)
                    if r.status_code == 200:
                        results[path] = {"status": 200, "body": r.json()}
                    elif r.status_code not in [404, 405]:
                        results[path] = r.status_code
                except Exception:
                    pass
        results["total_checked"] = len(prefixes) * len(names)
        results["found_200"] = [k for k in results if isinstance(results.get(k), dict) and results[k].get("status") == 200]
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(results, ensure_ascii=False),
        }

    if mode == "probe_v1":
        # Кабинет педагога / web routes
        teacher_id = int(params.get("teacher_id", 2))
        results = {}
        urls_to_try = [
            f"{S20_HOST}/v2api/1/teacher/{teacher_id}/graph",
            f"{S20_HOST}/v2api/1/teacher/{teacher_id}/schedule",
            f"{S20_HOST}/v2api/1/teacher/{teacher_id}/work-time",
            f"{S20_HOST}/v2api/1/teacher/graph/index",
            f"{S20_HOST}/v2api/1/teacher/schedule/index",
            f"{S20_HOST}/v2api/1/teacher/work-time/index",
            f"{S20_HOST}/v2api/1/teacher-to-graph/index",
            f"{S20_HOST}/v2api/1/teacher-to-schedule/index",
            f"{S20_HOST}/v2api/1/teacher-to-work-time/index",
            f"{S20_HOST}/v2api/1/teacher-to-skill/index",
            f"{S20_HOST}/v2api/1/teacher/view?id={teacher_id}",
            f"{S20_HOST}/v2api/1/teacher/{teacher_id}",
        ]
        for url in urls_to_try:
            for method in ["GET", "POST"]:
                try:
                    if method == "GET":
                        r = requests.get(url, headers=get_headers(token), timeout=3)
                    else:
                        r = requests.post(url, json={"teacher_id": teacher_id},
                                          headers=get_headers(token), timeout=3)
                    key = f"{method} {url.replace(S20_HOST, '')}"
                    if r.status_code == 200:
                        try:
                            results[key] = {"status": 200, "body": r.json()}
                        except Exception:
                            results[key] = {"status": 200, "text": r.text[:300]}
                    elif r.status_code not in [404, 405]:
                        results[key] = r.status_code
                except Exception:
                    pass
        results["found_200"] = [k for k in results if isinstance(results.get(k), dict) and results[k].get("status") == 200]
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(results, ensure_ascii=False),
        }

    if mode == "probe_settings":
        results = {}
        endpoints = ["branch", "company", "settings", "config",
                     "calendar-settings", "calendar-config",
                     "lesson-type", "subject", "room"]
        for ep in endpoints:
            url = f"{S20_HOST}/v2api/1/{ep}/index"
            try:
                r = requests.post(url, json={"page": 0, "pageSize": 50},
                                  headers=get_headers(token), timeout=3)
                if r.status_code == 200:
                    results[ep] = r.json()
                else:
                    results[ep] = r.status_code
            except Exception as e:
                results[ep] = str(e)
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(results, ensure_ascii=False),
        }

    if mode == "explore_cgi":
        teacher_id = int(params.get("teacher_id", 2))
        results = {}
        # cgi вернул 405 — попробуем разные методы и пути
        for method in ["GET", "POST", "PUT", "PATCH"]:
            url = f"{S20_HOST}/v2api/1/cgi/index"
            try:
                r = requests.request(method, url,
                                     json={"teacher_id": teacher_id, "page": 0, "pageSize": 100} if method != "GET" else None,
                                     headers=get_headers(token), timeout=4)
                results[f"index_{method}"] = {"status": r.status_code, "text": r.text[:800]}
            except Exception as e:
                results[f"index_{method}"] = str(e)

        # Возможно нужно cgi/list или cgi/get
        actions = ["list", "get", "view", "search", "all", "create", "find"]
        for action in actions:
            url = f"{S20_HOST}/v2api/1/cgi/{action}"
            try:
                r = requests.post(url, json={"teacher_id": teacher_id}, headers=get_headers(token), timeout=3)
                if r.status_code != 404:
                    results[f"cgi_{action}"] = {"status": r.status_code, "text": r.text[:500]}
            except Exception as e:
                pass

        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(results, ensure_ascii=False),
        }

    if mode == "explore_cabinet":
        # Глубокая разведка cabinet и cgi endpoints
        teacher_id = int(params.get("teacher_id", 2))
        results = {}

        # 1. Полный HTML и заголовки cabinet/teacher/graph
        url1 = f"{S20_HOST}/cabinet/teacher/graph?teacher_id={teacher_id}"
        r1 = requests.get(url1, headers=get_headers(token), timeout=5)
        results["cabinet_graph_full"] = {
            "status": r1.status_code,
            "content_type": r1.headers.get("Content-Type"),
            "length": len(r1.text),
            "preview_5k": r1.text[:5000],
        }

        # 2. Cabinet с другими параметрами
        url2 = f"{S20_HOST}/cabinet/api/teacher-graph?teacher_id={teacher_id}"
        r2 = requests.get(url2, headers={**get_headers(token), "Accept": "application/json"}, timeout=5)
        results["cabinet_api_graph"] = {
            "status": r2.status_code,
            "content_type": r2.headers.get("Content-Type"),
            "preview": r2.text[:2000],
        }

        # 3. cgi с разными методами
        for method in ["GET", "POST", "PUT"]:
            url = f"{S20_HOST}/v2api/1/cgi/index"
            try:
                if method == "GET":
                    r = requests.get(url, headers=get_headers(token), timeout=3)
                else:
                    r = requests.request(method, url, json={"teacher_id": teacher_id},
                                         headers=get_headers(token), timeout=3)
                results[f"cgi_{method}"] = {
                    "status": r.status_code,
                    "preview": r.text[:1000],
                }
            except Exception as e:
                results[f"cgi_{method}"] = str(e)

        # 4. Cabinet endpoints variations
        cabinet_paths = [
            f"/cabinet/api/teacher-graph/index?teacher_id={teacher_id}",
            f"/cabinet/api/graph?teacher_id={teacher_id}",
            f"/cabinet/api/schedule?teacher_id={teacher_id}",
            f"/cabinet/teacher/index?teacher_id={teacher_id}",
            f"/cabinet/teacher/{teacher_id}/graph",
            f"/cabinet/teacher-graph/index?teacher_id={teacher_id}",
            f"/cabinet/teacher-graph/get?teacher_id={teacher_id}",
            f"/cabinet/teacher-graph/list?teacher_id={teacher_id}",
        ]
        for path in cabinet_paths:
            url = f"{S20_HOST}{path}"
            try:
                r = requests.get(url, headers={**get_headers(token), "Accept": "application/json",
                                                "X-Requested-With": "XMLHttpRequest"}, timeout=3)
                results[path] = {
                    "status": r.status_code,
                    "ct": r.headers.get("Content-Type"),
                    "preview": r.text[:500],
                }
            except Exception as e:
                results[path] = str(e)

        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(results, ensure_ascii=False),
        }

    if mode == "probe_final":
        # Точечная проверка наиболее вероятных имён + типичные паттерны Yii2
        teacher_id = int(params.get("teacher_id", 2))
        results = {}
        # На основе кода yii2/alfacrm модели обычно называются camelCase
        # но URL — kebab-case. Контроллер действия — action<Name>
        candidates = [
            "cteacher", "c-teacher",
            "teacher-to-time", "teacher_time", "teacher-time-table",
            "time-table", "timetable",
            "graphic", "graphics", "rgraph",
            # У alfacrm есть отдельная "регулярная" таблица для часов работы
            "cteacher-time", "cteacher-graphic", "cteacher-schedule",
            "teacher-grapheme", "teacher-graf",
            # Из Yii2 пути обычно через /<controller>/<action>
            # А мы ищем модель — это другой path: /v2api/<resource>/<action>
            "cgraf", "cgrafic", "tt", "rt",
            # Calendar-related
            "wcalendar", "tcalendar", "scalendar",
        ]
        results_status = {}
        for name in candidates:
            for prefix in ["/v2api/1/", "/v2api/"]:
                url = f"{S20_HOST}{prefix}{name}/index"
                try:
                    r = requests.post(url, json={"teacher_id": teacher_id},
                                      headers=get_headers(token), timeout=3)
                    if r.status_code == 200:
                        results[f"{prefix}{name}"] = {"status": 200, "body": r.json()}
                    elif r.status_code != 404:
                        results_status[f"{prefix}{name}"] = r.status_code
                except Exception:
                    pass

        # Дополнительно: попробуем GET к URL аналогичному кабинету
        # У S20 есть портал педагога: /cabinet/teacher/...
        cabinet_urls = [
            f"{S20_HOST}/cabinet/api/teacher-graph?teacher_id={teacher_id}",
            f"{S20_HOST}/cabinet/teacher/graph?teacher_id={teacher_id}",
            f"{S20_HOST}/api/cabinet/graph?teacher_id={teacher_id}",
            # Возможно есть webhook/integration endpoint
            f"{S20_HOST}/v2api/1/cgi/index",
            f"{S20_HOST}/v2api/1/cti/index",
            f"{S20_HOST}/v2api/1/customer-to-tariff/index",
        ]
        for url in cabinet_urls:
            try:
                r = requests.get(url, headers=get_headers(token), timeout=3)
                if r.status_code == 200:
                    try:
                        results[url] = {"status": 200, "body": r.json()}
                    except Exception:
                        results[url] = {"status": 200, "text": r.text[:200]}
                elif r.status_code != 404:
                    results_status[url] = r.status_code
            except Exception:
                pass

        results["__non404_status"] = results_status
        results["__found_200"] = [k for k in results if isinstance(results.get(k), dict) and results[k].get("status") == 200]
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(results, ensure_ascii=False),
        }

    if mode == "_disabled_login_step1":
        # v3: Шаг 1 — логин/пароль, сервер шлёт код на почту.
        email = os.environ.get("S20_ADMIN_EMAIL", S20_EMAIL)
        password = os.environ.get("S20_ADMIN_PASSWORD", "")
        if not password:
            return {"statusCode": 400, "headers": cors_headers,
                    "body": json.dumps({"error": "no password"})}

        import re
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
            "Accept-Language": "ru-RU,ru;q=0.9",
        })
        page = session.get(f"{S20_HOST}/login", timeout=8)
        csrf_m = re.search(r'name="csrf-token" content="([^"]+)"', page.text)
        csrf = csrf_m.group(1) if csrf_m else ""

        r = session.post(f"{S20_HOST}/login", data={
            "_csrf": csrf,
            "LoginForm[username]": email,
            "LoginForm[password]": password,
            "LoginForm[rememberMe]": "1",
        }, headers={"Referer": f"{S20_HOST}/login", "X-CSRF-Token": csrf, "Origin": S20_HOST},
            timeout=8, allow_redirects=True)

        body = r.text
        new_csrf_m = re.search(r'name="csrf-token" content="([^"]+)"', body)
        new_csrf = new_csrf_m.group(1) if new_csrf_m else csrf
        inputs = re.findall(r'<input[^>]+name="([^"]+)"', body)
        has_2fa = "Login2FAForm[code]" in inputs

        # Сохраняем сессию в БД
        cookies_json = json.dumps(dict(session.cookies))
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        with conn.cursor() as cur:
            cur.execute("DELETE FROM s20_session")
            cur.execute(
                "INSERT INTO s20_session (cookies, csrf, is_authenticated) VALUES (%s, %s, %s)",
                (cookies_json, new_csrf, False)
            )
            conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "ok": True,
                "step": 1,
                "needs_2fa": has_2fa,
                "msg": "Код отправлен тебе на почту. Сохрани его в секрет S20_AUTH_CODE и вызови mode=login_step2",
            }, ensure_ascii=False),
        }

    if mode == "login_step2":
        # Шаг 2: подставляем код 2FA, используя cookies из БД
        code = os.environ.get("S20_AUTH_CODE", "").strip()
        if not code:
            return {"statusCode": 400, "headers": cors_headers,
                    "body": json.dumps({"error": "Нужен секрет S20_AUTH_CODE с кодом из письма"})}

        import re
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT cookies, csrf FROM s20_session ORDER BY id DESC LIMIT 1")
            row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 400, "headers": cors_headers,
                    "body": json.dumps({"error": "Сначала вызови login_step1"})}

        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
            "Accept-Language": "ru-RU,ru;q=0.9",
        })
        for k, v in json.loads(row["cookies"]).items():
            session.cookies.set(k, v)
        csrf = row["csrf"]

        r = session.post(f"{S20_HOST}/login", data={
            "_csrf": csrf,
            "Login2FAForm[code]": code,
            "Login2FAForm[rememberMe]": "1",
        }, headers={"Referer": f"{S20_HOST}/login", "X-CSRF-Token": csrf, "Origin": S20_HOST},
            timeout=8, allow_redirects=True)

        body = r.text
        inputs = re.findall(r'<input[^>]+name="([^"]+)"', body)
        is_login_page = "LoginForm[username]" in inputs or "Login2FAForm[code]" in inputs

        # Чистим текст для ошибок
        text_body = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', body, flags=re.DOTALL)
        text_body = re.sub(r'<[^>]+>', ' ', text_body)
        text_body = re.sub(r'\s+', ' ', text_body).strip()

        if not is_login_page:
            # Успех! Сохраняем авторизованную сессию
            cookies_json = json.dumps(dict(session.cookies))
            conn = psycopg2.connect(os.environ["DATABASE_URL"])
            with conn.cursor() as cur:
                cur.execute("UPDATE s20_session SET cookies = %s, is_authenticated = TRUE, updated_at = NOW()",
                            (cookies_json,))
                conn.commit()
            conn.close()
            return {
                "statusCode": 200,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps({
                    "ok": True, "step": 2, "authenticated": True,
                    "final_url": r.url,
                    "msg": "Сессия сохранена! Теперь можно дёргать mode=fetch_graph для получения графика педагогов",
                }, ensure_ascii=False),
            }
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "ok": False, "step": 2, "authenticated": False,
                "final_url": r.url,
                "preview": text_body[:600],
                "msg": "Код не подошёл или истёк. Повтори login_step1 и сразу обнови S20_AUTH_CODE.",
            }, ensure_ascii=False),
        }

    if mode == "fetch_graph":
        # Используем авторизованную сессию из БД, пробуем достать график педагога
        teacher_id = int(params.get("teacher_id", 2))
        import re
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT cookies, is_authenticated FROM s20_session ORDER BY id DESC LIMIT 1")
            row = cur.fetchone()
        conn.close()
        if not row or not row["is_authenticated"]:
            return {"statusCode": 400, "headers": cors_headers,
                    "body": json.dumps({"error": "Нет авторизованной сессии. Сделай login_step1 и login_step2"})}

        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        })
        for k, v in json.loads(row["cookies"]).items():
            session.cookies.set(k, v)

        # Дёргаем страницу редактирования педагога (там в HTML обычно зашит график)
        urls = [
            f"{S20_HOST}/1/teacher/update/id/{teacher_id}",
            f"{S20_HOST}/1/teacher/view/id/{teacher_id}",
            f"{S20_HOST}/1/cgraph/index?teacher_id={teacher_id}",
            f"{S20_HOST}/1/teacher-graph/index?teacher_id={teacher_id}",
            f"{S20_HOST}/1/teacher/graph/id/{teacher_id}",
            f"{S20_HOST}/1/teacher/graph?id={teacher_id}",
        ]
        results = {}
        for url in urls:
            try:
                r = session.get(url, timeout=6, headers={"X-Requested-With": "XMLHttpRequest"})
                ct = r.headers.get("Content-Type", "")
                # Если HTML — ищем упоминания графика, дни недели, часы
                text_clean = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', r.text, flags=re.DOTALL)
                text_clean = re.sub(r'<[^>]+>', ' ', text_clean)
                text_clean = re.sub(r'\s+', ' ', text_clean).strip()
                key = url.replace(S20_HOST, "")
                results[key] = {
                    "status": r.status_code,
                    "ct": ct[:50],
                    "length": len(r.text),
                    "has_login_form": "LoginForm" in r.text,
                    "has_graph_word": "график" in r.text.lower() or "graph" in r.text.lower(),
                    "has_time_inputs": bool(re.search(r'\d{1,2}:\d{2}', r.text)),
                    "preview_text": text_clean[:800],
                }
            except Exception as e:
                results[url.replace(S20_HOST, "")] = str(e)
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(results, ensure_ascii=False),
        }

    if mode == "probe_session":

    if mode == "probe_session":
        teacher_id = int(params.get("teacher_id", 2))
        email = os.environ.get("S20_ADMIN_EMAIL", S20_EMAIL)
        password = os.environ.get("S20_ADMIN_PASSWORD", "")
        results = {}

        if not password:
            return {
                "statusCode": 200,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Need S20_ADMIN_PASSWORD secret"}),
            }

        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
        })

        # 1. Получаем CSRF + cookies
        login_page = session.get(f"{S20_HOST}/login", timeout=8, allow_redirects=True)
        results["login_page"] = {"status": login_page.status_code, "url": login_page.url,
                                  "cookies": dict(session.cookies)}

        import re
        csrf_match = re.search(r'name="csrf-token" content="([^"]+)"', login_page.text)
        csrf_param_match = re.search(r'name="csrf-param" content="([^"]+)"', login_page.text)
        csrf = csrf_match.group(1) if csrf_match else None
        csrf_param = csrf_param_match.group(1) if csrf_param_match else "_csrf"
        results["csrf_param"] = csrf_param
        results["csrf_len"] = len(csrf) if csrf else 0

        # Ищем форму логина в HTML
        form_action = re.search(r'<form[^>]+action="([^"]*login[^"]*)"', login_page.text)
        form_inputs = re.findall(r'<input[^>]+name="([^"]+)"', login_page.text)
        results["form_action"] = form_action.group(1) if form_action else None
        results["form_inputs"] = form_inputs

        # 2. Логин — правильное поле LoginForm[username]
        login_data = {csrf_param: csrf,
                      "LoginForm[username]": email,
                      "LoginForm[password]": password,
                      "LoginForm[rememberMe]": "1"}
        r = session.post(f"{S20_HOST}/login", data=login_data, timeout=8, allow_redirects=False,
                         headers={"Referer": f"{S20_HOST}/login",
                                  "X-CSRF-Token": csrf or "",
                                  "Origin": S20_HOST})
        # Ищем ошибки в HTML ответе
        err_match = re.search(r'class="[^"]*help-block[^"]*"[^>]*>([^<]+)<', r.text)
        alert_match = re.search(r'class="[^"]*alert[^"]*"[^>]*>(.{1,300}?)<', r.text, re.DOTALL)
        results["login_response"] = {
            "status": r.status_code,
            "location": r.headers.get("Location", ""),
            "set_cookie_has_id": "PHPSESSID" in r.headers.get("Set-Cookie", ""),
            "cookies_after": dict(session.cookies),
            "html_length": len(r.text),
            "error_text": err_match.group(1).strip() if err_match else None,
            "alert_text": alert_match.group(1).strip() if alert_match else None,
            "email_used": email,
            "password_len": len(password),
        }
        # Выделим всё что после формы (там обычно ошибки и тексты)
        body_start = r.text.find("<body")
        body_text = r.text[body_start:body_start+5000] if body_start > 0 else ""
        # Чистим теги
        clean = re.sub(r'<script[^>]*>.*?</script>', '', body_text, flags=re.DOTALL)
        clean = re.sub(r'<style[^>]*>.*?</style>', '', clean, flags=re.DOTALL)
        clean = re.sub(r'<[^>]+>', ' ', clean)
        clean = re.sub(r'\s+', ' ', clean).strip()
        results["visible_text"] = clean[:2000]
        # Ищем ключевые слова
        results["has_keywords"] = {
            "неправ": "неправ" in r.text.lower(),
            "ошиб": "ошиб" in r.text.lower(),
            "invalid": "invalid" in r.text.lower(),
            "captcha": "captcha" in r.text.lower(),
            "verifyCode": "verifycode" in r.text.lower(),
            "блокир": "блокир" in r.text.lower(),
        }
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(results, ensure_ascii=False),
        }

        # 3. Если залогинились — пробуем endpoint'ы для графика
        if "login" not in r.url.lower() or r.status_code == 200:
            test_paths = [
                f"/1/teacher/view/id/{teacher_id}",
                f"/1/teacher/update/id/{teacher_id}",
                f"/1/teacher-graph?teacher_id={teacher_id}",
                f"/1/teacher-graph/index?teacher_id={teacher_id}",
                f"/1/cgraph?teacher_id={teacher_id}",
                f"/1/cgraph/index?teacher_id={teacher_id}",
                f"/1/cgraph/list?teacher_id={teacher_id}",
                f"/1/teacher-to-graph?teacher_id={teacher_id}",
                f"/1/graph/index?teacher_id={teacher_id}",
                f"/1/graph?teacher_id={teacher_id}",
                f"/1/teacher/graph?id={teacher_id}",
                f"/1/teacher-time?teacher_id={teacher_id}",
                f"/1/teacher-work-time?teacher_id={teacher_id}",
                f"/1/teacher-work-graph?teacher_id={teacher_id}",
                f"/1/teacher-graphic?teacher_id={teacher_id}",
            ]
            for path in test_paths:
                url = f"{S20_HOST}{path}"
                try:
                    rr = session.get(url, timeout=5, headers={
                        "X-Requested-With": "XMLHttpRequest",
                        "Accept": "application/json, text/html",
                    })
                    if rr.status_code != 404:
                        ct = rr.headers.get("Content-Type", "")
                        is_html = "html" in ct
                        # Если HTML — ищем упоминания графика
                        preview = rr.text[:600] if not is_html else (
                            "HTML, has_graph=" + str("graph" in rr.text.lower() or "график" in rr.text.lower())
                            + "; has_input=" + str("input" in rr.text.lower())
                            + "; length=" + str(len(rr.text))
                        )
                        results[path] = {"status": rr.status_code, "ct": ct[:60], "preview": preview}
                except Exception as e:
                    results[path] = str(e)
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