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

INDIVIDUAL_TEACHERS = {
    2: "Анастасия Шишаева",
    18: "Анна Карамова",
    11: "Валерия Камнева",
    4: "Дарья Еремина",
}

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
    for status_arg in (None, 1, 2):
        try:
            chunk = get_lessons(token, date_from, date_to, status=status_arg)
        except Exception:
            chunk = []
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
    for is_study_flag, removed_flag in ((1, 0), (0, 0), (1, 1), (0, 1)):
        try:
            for it in _fetch_customers_raw(token, is_study=is_study_flag, removed=removed_flag):
                cid = it.get("id")
                if cid in seen:
                    continue
                seen.add(cid)
                merged.append(it)
        except Exception as e:
            print(f"customers fetch is_study={is_study_flag} removed={removed_flag} failed: {e}")
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

    regular_busy_by_weekday = {}
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

    if mode == "next_group_week":
        try:
            start_dt = datetime.strptime(date_from, "%Y-%m-%d").date()
        except Exception:
            start_dt = today.date()
        monday = start_dt - timedelta(days=start_dt.weekday())
        found = None
        for week_offset in range(0, 12):
            wk_from = monday + timedelta(days=week_offset * 7)
            wk_to = wk_from + timedelta(days=5)
            try:
                lessons = get_lessons(
                    token, wk_from.strftime("%Y-%m-%d"), wk_to.strftime("%Y-%m-%d"), status=1
                )
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
        try:
            lessons = get_lessons_all_statuses(token, date_from, date_to)
            teachers = get_teachers(token)
        except Exception as e:
            return {
                "statusCode": 502,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps({"error": f"S20 fetch failed: {str(e)}"}, ensure_ascii=False),
            }

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
        for lesson in lessons:
            ltype = lesson.get("lesson_type_id")
            if ltype == 1:
                continue
            if lesson.get("status") != 1:
                continue  # только запланированные

            lesson_date = (lesson.get("date") or "")[:10]
            if not lesson_date:
                continue
            try:
                d = datetime.strptime(lesson_date, "%Y-%m-%d").date()
            except Exception:
                continue
            weekday = d.weekday()
            if weekday > 5:
                continue

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

        # Берём запланированные (1) и проведённые (3) уроки — оба считаются занятыми
        try:
            booked_lessons = get_lessons_all_statuses(token, date_from, date_to)
            # Оставляем только status=1 и status=3 (отменённые status=2 не считаем занятыми)
            booked_lessons = [l for l in booked_lessons if l.get("status") in (1, 3)]
        except Exception:
            booked_lessons = []

        # booked_by_date[(date_str, teacher_id)] = [{time_from, time_to, lesson_id}]
        booked_by_date = {}
        for lesson in booked_lessons:
            if lesson.get("lesson_type_id") != 1:
                continue
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
                key = (lesson_date, int(tid))
                booked_by_date.setdefault(key, []).append({
                    "time_from": tf, "time_to": tt, "lesson_id": lesson.get("id"),
                })

        days_out = []
        current = dt_from
        while current <= dt_to:
            weekday = current.weekday()
            if weekday <= 5:  # пн-сб
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
                        # Проверяем: занят ли этот слот
                        busy = False
                        booked_lesson_id = None
                        for booked in booked_by_date.get((date_str, int(teacher_id)), []):
                            if booked["time_from"] < tt and booked["time_to"] > tf:
                                busy = True
                                booked_lesson_id = booked.get("lesson_id")
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

    # default: mode=lessons — все статусы за период
    lessons = get_lessons_all_statuses(token, date_from, date_to)
    return {
        "statusCode": 200,
        "headers": {**cors_headers, "Content-Type": "application/json"},
        "body": json.dumps({
            "lessons": lessons,
            "date_from": date_from,
            "date_to": date_to,
        }, ensure_ascii=False),
    }