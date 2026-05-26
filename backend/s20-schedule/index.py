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