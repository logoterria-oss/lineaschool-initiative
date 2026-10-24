import os
import json
import datetime
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor

# Окно взаимодействия — туда сообщаем, кто из админов сейчас на смене
INTERACTION_HOOK_URL = (
    "https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1?action=shift-hook"
)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Service-Key",
    "Access-Control-Max-Age": "86400",
}

KINDS = ("work", "dayoff", "vacation", "sick")
SCHEMA = "t_p93118852_lineaschool_initiati"

# Школа работает по Москве, а сервер живёт в UTC.
# Все отметки смен и «сегодня» считаем в московском времени.
MSK_NOW = "(now()::timestamp + interval '3 hours')"
MSK_TODAY = f"({MSK_NOW})::date"


def db_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _msk_today() -> str:
    """Сегодняшняя дата по Москве — единая точка правды для смен.

    Сервер живёт в UTC, сотрудники — в разных часовых поясах,
    поэтому день смены считаем только отсюда.
    """
    return (
        datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(hours=3)
    ).strftime("%Y-%m-%d")


def _json(status, payload):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False, default=str),
    }


def handler(event: dict, context) -> dict:
    """График работы администраторов по датам: список смен за месяц, сохранение и удаление смены"""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        if method == "GET":
            params = event.get("queryStringParameters") or {}
            act = str(params.get("action") or "")
            if act == "my-shift":
                return my_shift_state(event)
            if act == "on-shift":
                return on_shift_now()
            if act == "sync-interaction":
                return sync_interaction()
            if act == "checklist":
                return get_checklist(event)
            if act == "dash":
                return get_dash(event)
            if act == "head-tasks":
                return get_head_tasks(event)
            if act == "reminders":
                return get_reminders(event)
            return get_shifts(event)
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            act = str(body.get("action") or "")
            if act in ("start", "finish"):
                return mark_shift(event, body, act)
            if act == "checklist":
                return save_checklist(event, body)
            if act == "dash":
                return save_dash(event, body)
            if act == "head-tasks":
                return save_head_tasks(event, body)
            if act == "fill-template":
                return fill_template(body)
            if act == "reminder-draft":
                return reminder_draft(event, body)
            if act == "reminder-mark":
                return reminder_mark(event, body)
            if act == "reminder-confirm":
                return reminder_confirm(event, body)
            return save_shift(event)
        if method == "DELETE":
            return delete_shift(event)
        return _json(405, {"error": "Method not allowed"})
    except Exception as e:
        print(f"admin-shifts error: {type(e).__name__}: {e}")
        return _json(500, {"error": str(e)})


def _admins(cur):
    cur.execute(
        "SELECT id, full_name, job_title FROM staff "
        "WHERE role IN ('admin', 'head') AND status = 'active' "
        "ORDER BY role DESC, full_name"
    )
    return [dict(r) for r in cur.fetchall()]


def _me(cur, event):
    """Кто вызывает — по токену админки."""
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    if not token:
        return None
    cur.execute(
        "SELECT s.id, s.full_name, s.role FROM staff_sessions ss "
        "JOIN staff s ON s.id = ss.staff_id "
        "WHERE ss.token = %s AND ss.expires_at > now() AND s.status = 'active'",
        (token,),
    )
    row = cur.fetchone()
    return dict(row) if row else None


def mark_shift(event: dict, body: dict, act: str) -> dict:
    """Отметка «на смене» и «смена закончена» самим администратором.

    День смены и время отметки берём ТОЛЬКО с сервера, по Москве.
    Часы на компьютере сотрудника не участвуют: администраторы работают
    из разных часовых поясов (например, Новосибирск +4 к Москве), и дата
    с их ПК уводила бы смену не в тот день.

    Смена живёт в пределах московских суток: не закрыли до 00:00 —
    она считается закрытой, отметка ухода уже не ставится.
    """
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})

            cur.execute(
                f"SELECT id, started_at, finished_at, to_char({MSK_TODAY}, 'YYYY-MM-DD') AS today "
                f"FROM admin_shifts WHERE staff_id = %s AND shift_date = {MSK_TODAY}",
                (me["id"],),
            )
            row = cur.fetchone()

            if not row:
                cur.execute(
                    f"INSERT INTO admin_shifts (staff_id, staff_name, shift_date, time_from, time_to, kind) "
                    f"VALUES (%s, %s, {MSK_TODAY}, '', '', 'work') "
                    f"RETURNING id, started_at, finished_at",
                    (me["id"], me["full_name"]),
                )
                row = cur.fetchone()

            # Нельзя закрыть смену, которую не открывали: иначе в дне
            # остаётся время ухода без времени прихода.
            if act == "finish" and not row.get("started_at"):
                return _json(400, {"error": "Смена не открыта — закрывать нечего"})

            # Повторное открытие затёрло бы отметку ухода
            if act == "start" and row.get("finished_at"):
                return _json(400, {"error": "Смена за этот день уже закрыта"})

            # Смену могли забрать — повторное закрытие затёрло бы время передачи
            if act == "finish" and row.get("finished_at"):
                return _json(409, {"error": "Смена уже закрыта"})

            # Сотрудник забирает смену: у тех, кто ещё не закрылся, смена
            # закрывается этой же минутой, с пометкой, кому передана
            taken_from = []
            if act == "start" and body.get("take_over"):
                cur.execute(
                    f"UPDATE admin_shifts SET finished_at = {MSK_NOW}, updated_at = {MSK_NOW}, "
                    f"note = trim(both ' ' from coalesce(note, '') || ' Смену забрал(а) ' || %s || ' в ' "
                    f"|| to_char({MSK_NOW}, 'HH24:MI')) "
                    f"WHERE shift_date = {MSK_TODAY} AND staff_id <> %s "
                    f"AND started_at IS NOT NULL AND finished_at IS NULL "
                    f"RETURNING staff_name",
                    (me["full_name"], me["id"]),
                )
                taken_from = [r["staff_name"] for r in cur.fetchall()]

            field = "started_at" if act == "start" else "finished_at"
            cur.execute(
                f"UPDATE admin_shifts SET {field} = {MSK_NOW}, updated_at = {MSK_NOW} "
                f"WHERE id = %s RETURNING "
                f"to_char(started_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS started_at, "
                f"to_char(finished_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS finished_at",
                (row["id"],),
            )
            marks = dict(cur.fetchone())
            conn.commit()

            # Сразу сообщаем окну взаимодействия обновлённый состав смены
            hook = push_shift_to_interaction(cur)
        return _json(200, {
            "ok": True, **marks, "date": _msk_today(), "interaction": hook, "taken_from": taken_from,
        })
    finally:
        conn.close()


def my_shift_state(event: dict) -> dict:
    """Состояние смены администратора на сегодня — для кнопки в кабинете.

    «Сегодня» определяет сервер по Москве. Дату с компьютера сотрудника
    не используем: в Новосибирске после 21:00 по Москве уже следующие
    сутки, и кнопка показывала бы смену не того дня.
    """
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})
            cur.execute(
                f"SELECT to_char(started_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS started_at, "
                f"to_char(finished_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS finished_at, kind "
                f"FROM admin_shifts WHERE staff_id = %s AND shift_date = {MSK_TODAY}",
                (me["id"],),
            )
            row = cur.fetchone()
        return _json(200, {
            "ok": True,
            "started_at": (row or {}).get("started_at"),
            "finished_at": (row or {}).get("finished_at"),
            "planned": bool(row),
            "staff_id": me["id"],
            # Дата смены по Москве — фронт показывает её рядом с кнопкой
            "date": _msk_today(),
        })
    finally:
        conn.close()


def _only_digits(phone: str) -> str:
    d = "".join(c for c in str(phone or "") if c.isdigit())
    if len(d) == 11 and d.startswith("8"):
        d = "7" + d[1:]
    return d


def push_shift_to_interaction(cur) -> dict:
    """Сообщаем окну взаимодействия полный список админов, которые сейчас на смене.

    Шлём телефоны — окно сопоставляет сотрудников по ним.
    Руководитель и РУО тоже ведут админскую работу (сб/вс) — их отправляем,
    если они сами нажали «На смене».
    """
    key = os.environ.get("INTERACTION_SERVICE_KEY")
    if not key:
        return {"sent": False, "error": "no_service_key"}

    cur.execute(
        f"SELECT s.phone FROM admin_shifts sh "
        f"JOIN staff s ON s.id = sh.staff_id "
        # Смена живёт в пределах московских суток: в 00:00 незакрытая
        # смена считается закрытой и из состава уходит сама
        f"WHERE sh.shift_date = {MSK_TODAY} "
        f"AND sh.started_at IS NOT NULL AND sh.finished_at IS NULL "
        f"AND s.role IN ('admin', 'head') AND s.status = 'active'"
    )
    phones = [_only_digits(r["phone"]) for r in cur.fetchall()]
    phones = [p for p in phones if p]

    payload = json.dumps({"on_shift": phones}).encode()
    req = urllib.request.Request(
        INTERACTION_HOOK_URL,
        data=payload,
        headers={"Content-Type": "application/json", "X-Service-Key": key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            code = resp.status
            body = json.loads(resp.read().decode() or "{}")
        print(f"shift-hook POST -> {code} {json.dumps(body, ensure_ascii=False)} phones={phones}")
        return {"sent": True, "status": code, "on_shift": phones, "response": body}
    except urllib.error.HTTPError as e:
        text = e.read().decode(errors="replace")[:300]
        print(f"shift-hook POST -> HTTP {e.code} {text} phones={phones}")
        return {"sent": False, "status": e.code, "on_shift": phones, "error": text}
    except Exception as e:
        print(f"shift-hook POST failed: {e} phones={phones}")
        return {"sent": False, "on_shift": phones, "error": str(e)}


def sync_interaction() -> dict:
    """Повторно отправить окну взаимодействия текущий состав смены."""
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            hook = push_shift_to_interaction(cur)
        return _json(200, {"ok": True, **hook})
    finally:
        conn.close()


def on_shift_now() -> dict:
    """Кто из администраторов сейчас на смене — открытый список для «Окна взаимодействия».

    На смене = сегодня по Москве нажал «На смене» и ещё не нажал
    «Смена закончена». В 00:00 по Москве смена считается закрытой:
    незакрытая вчерашняя из состава уходит сама.
    """
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f"SELECT sh.staff_id, sh.staff_name, s.job_title, s.role, "
                f"to_char(sh.started_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS started_at "
                f"FROM admin_shifts sh "
                f"LEFT JOIN staff s ON s.id = sh.staff_id "
                f"WHERE sh.shift_date = {MSK_TODAY} "
                f"AND sh.started_at IS NOT NULL AND sh.finished_at IS NULL "
                f"ORDER BY sh.started_at",
                (),
            )
            rows = [dict(r) for r in cur.fetchall()]
        return _json(200, {"ok": True, "on_shift": rows, "count": len(rows)})
    finally:
        conn.close()


def get_shifts(event: dict) -> dict:
    """Смены за месяц: ?month=YYYY-MM. Возвращает список смен и список администраторов."""
    params = event.get("queryStringParameters") or {}
    month = str(params.get("month") or "")[:7]
    if len(month) != 7:
        return _json(400, {"error": "month required in format YYYY-MM"})

    first = month + "-01"

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, staff_id, staff_name, shift_date, time_from, time_to, kind, note, "
                "to_char(started_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS started_at, "
                "to_char(finished_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS finished_at "
                "FROM admin_shifts "
                "WHERE shift_date >= %s::date "
                "AND shift_date < (%s::date + INTERVAL '1 month') "
                "ORDER BY shift_date, staff_name",
                (first, first),
            )
            shifts = [dict(r) for r in cur.fetchall()]
            admins = _admins(cur)

            # Задачи из журнала административного учёта за тот же месяц —
            # показываем их в подсказке на ячейке графика
            cur.execute(
                f"SELECT staff_id, to_char(log_date, 'YYYY-MM-DD') AS log_date, "
                f"task_code, task_title, subject, minutes "
                f"FROM {SCHEMA}.work_log "
                f"WHERE log_date >= %s::date AND log_date < (%s::date + INTERVAL '1 month') "
                f"ORDER BY log_date, id",
                (first, first),
            )
            tasks = [dict(r) for r in cur.fetchall()]
        return _json(200, {
            "shifts": shifts, "admins": admins, "month": month, "tasks": tasks,
        })
    finally:
        conn.close()


def save_shift(event: dict) -> dict:
    """Создать или обновить смену.
    Body: { staff_id, date, time_from, time_to, kind, note }
    """
    body = json.loads(event.get("body") or "{}")

    try:
        staff_id = int(body.get("staff_id"))
    except (TypeError, ValueError):
        return _json(400, {"error": "staff_id required"})

    date = str(body.get("date") or "")[:10]
    if len(date) != 10:
        return _json(400, {"error": "date required in format YYYY-MM-DD"})

    kind = str(body.get("kind") or "work")
    if kind not in KINDS:
        return _json(400, {"error": "unknown kind"})

    time_from = str(body.get("time_from") or "09:00")[:5]
    time_to = str(body.get("time_to") or "18:00")[:5]
    if kind != "work":
        time_from = ""
        time_to = ""
    note = str(body.get("note") or "")[:500]

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT full_name FROM staff WHERE id = %s", (staff_id,))
            row = cur.fetchone()
            if not row:
                return _json(400, {"error": "staff not found"})
            staff_name = row["full_name"]

            cur.execute(
                "INSERT INTO admin_shifts (staff_id, staff_name, shift_date, time_from, time_to, kind, note) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "ON CONFLICT (staff_id, shift_date) DO UPDATE SET "
                "time_from = EXCLUDED.time_from, time_to = EXCLUDED.time_to, "
                "kind = EXCLUDED.kind, note = EXCLUDED.note, "
                f"staff_name = EXCLUDED.staff_name, updated_at = {MSK_NOW} "
                f"RETURNING id, staff_id, staff_name, shift_date, time_from, time_to, kind, note, "
                f"to_char(started_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS started_at, "
                f"to_char(finished_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS finished_at",
                (staff_id, staff_name, date, time_from, time_to, kind, note),
            )
            saved = dict(cur.fetchone())
            conn.commit()
        return _json(200, {"ok": True, "shift": saved})
    finally:
        conn.close()


# Типовая неделя администрирования (с октября 2026).
# Ключ — день недели (0 = понедельник), значение — смены (телефон, с, до).
# Сотрудника ищем по телефону: так шаблон не зависит от id в базе.
WEEK_TEMPLATE = {
    **{wd: [("79236138874", "09:00", "12:00"), ("79277601832", "12:00", "20:00")] for wd in range(5)},
    5: [("79236251611", "09:00", "20:00")],
    6: [("79879500712", "09:00", "20:00")],
}


def fill_template(body: dict) -> dict:
    """Расставить смены по типовой неделе на период.
    Body: { date_from, date_to, overwrite }
    overwrite=false — трогаем только пустые дни (ручные замены сохраняются).
    overwrite=true — заменяем неотмеченные смены дня шаблоном.
    Дни, где кто-то уже отметился «На смене», не меняем никогда.
    """
    try:
        d_from = datetime.date.fromisoformat(str(body.get("date_from"))[:10])
        d_to = datetime.date.fromisoformat(str(body.get("date_to"))[:10])
    except ValueError:
        return _json(400, {"error": "date_from/date_to required"})
    if d_to < d_from or (d_to - d_from).days > 370:
        return _json(400, {"error": "bad period"})
    overwrite = bool(body.get("overwrite"))

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, full_name, phone FROM staff WHERE status = 'active'")
            by_phone = {_only_digits(r["phone"]): r for r in cur.fetchall()}

            cur.execute(
                "SELECT shift_date, bool_or(started_at IS NOT NULL OR finished_at IS NOT NULL) AS marked "
                "FROM admin_shifts WHERE shift_date BETWEEN %s AND %s GROUP BY shift_date",
                (d_from, d_to),
            )
            existing = {r["shift_date"]: r["marked"] for r in cur.fetchall()}

            added = skipped = 0
            d = d_from
            while d <= d_to:
                if d in existing and (existing[d] or not overwrite):
                    skipped += 1
                    d += datetime.timedelta(days=1)
                    continue
                if d in existing:
                    cur.execute("DELETE FROM admin_shifts WHERE shift_date = %s", (d,))
                for phone, t_from, t_to in WEEK_TEMPLATE.get(d.weekday(), []):
                    st = by_phone.get(phone)
                    if not st:
                        continue
                    cur.execute(
                        "INSERT INTO admin_shifts (staff_id, staff_name, shift_date, time_from, time_to, kind) "
                        "VALUES (%s, %s, %s, %s, %s, 'work') ON CONFLICT (staff_id, shift_date) DO NOTHING",
                        (st["id"], st["full_name"], d, t_from, t_to),
                    )
                    added += 1
                d += datetime.timedelta(days=1)
            conn.commit()
        return _json(200, {"ok": True, "added": added, "skipped_days": skipped})
    finally:
        conn.close()


def get_head_tasks(event: dict) -> dict:
    """Задачи руководителя на дату: ?action=head-tasks&date=YYYY-MM-DD или &month=YYYY-MM"""
    params = event.get("queryStringParameters") or {}
    date = str(params.get("date") or "")[:10]
    month = str(params.get("month") or "")[:7]

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if len(date) == 10:
                cur.execute(
                    f"SELECT id, to_char(shift_date, 'YYYY-MM-DD') AS shift_date, "
                    f"staff_id, title FROM {SCHEMA}.shift_head_tasks "
                    f"WHERE shift_date = %s ORDER BY id",
                    (date,),
                )
            elif len(month) == 7:
                first = month + "-01"
                cur.execute(
                    f"SELECT id, to_char(shift_date, 'YYYY-MM-DD') AS shift_date, "
                    f"staff_id, title FROM {SCHEMA}.shift_head_tasks "
                    f"WHERE shift_date >= %s::date "
                    f"AND shift_date < (%s::date + INTERVAL '1 month') ORDER BY shift_date, id",
                    (first, first),
                )
            else:
                return _json(400, {"error": "date or month required"})
            rows = [dict(r) for r in cur.fetchall()]
        return _json(200, {"ok": True, "tasks": rows})
    finally:
        conn.close()


def save_head_tasks(event: dict, body: dict) -> dict:
    """Полностью переписывает задачи руководителя на дату.

    Body: { action: 'head-tasks', date, tasks: [{ staff_id, title }] }
    """
    date = str(body.get("date") or "")[:10]
    if len(date) != 10:
        return _json(400, {"error": "date required"})
    tasks = body.get("tasks") or []

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})

            cur.execute(f"DELETE FROM {SCHEMA}.shift_head_tasks WHERE shift_date = %s", (date,))
            for t in tasks:
                title = str(t.get("title") or "").strip()[:300]
                if not title:
                    continue
                try:
                    sid = int(t.get("staff_id"))
                except (TypeError, ValueError):
                    continue
                cur.execute(
                    f"INSERT INTO {SCHEMA}.shift_head_tasks "
                    f"(shift_date, staff_id, title, created_by) VALUES (%s, %s, %s, %s)",
                    (date, sid, title, me["id"]),
                )
            conn.commit()

            cur.execute(
                f"SELECT id, to_char(shift_date, 'YYYY-MM-DD') AS shift_date, staff_id, title "
                f"FROM {SCHEMA}.shift_head_tasks WHERE shift_date = %s ORDER BY id",
                (date,),
            )
            rows = [dict(r) for r in cur.fetchall()]
        return _json(200, {"ok": True, "tasks": rows})
    finally:
        conn.close()


def get_checklist(event: dict) -> dict:
    """Мой чек-лист за день: отметки и задачи руководителя лично мне.

    ?action=checklist&date=YYYY-MM-DD
    Руководитель может смотреть чужой: &staff_id=N
    """
    params = event.get("queryStringParameters") or {}
    date = str(params.get("date") or "")[:10]
    if len(date) != 10:
        return _json(400, {"error": "date required"})

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})

            staff_id = me["id"]
            asked = params.get("staff_id")
            if asked and me.get("role") == "head":
                staff_id = int(asked)

            cur.execute(
                f"SELECT item_key, done, comment FROM {SCHEMA}.shift_checklist "
                f"WHERE shift_date = %s AND staff_id = %s",
                (date, staff_id),
            )
            marks = [dict(r) for r in cur.fetchall()]

            cur.execute(
                f"SELECT id, title FROM {SCHEMA}.shift_head_tasks "
                f"WHERE shift_date = %s AND staff_id = %s ORDER BY id",
                (date, staff_id),
            )
            head_tasks = [dict(r) for r in cur.fetchall()]

            # Пункт «Остаток занятий»: напоминание об оплате отправляют один раз.
            # Если по ученику галку уже поставили в предыдущие дни — сегодня его
            # в списке не показываем, даже если отмечал другой администратор.
            # Смотрим на два месяца назад: дальше напоминание уже неактуально.
            cur.execute(
                f"SELECT DISTINCT item_key FROM {SCHEMA}.shift_checklist "
                f"WHERE done = true AND shift_date < %s AND shift_date >= %s::date - 60 "
                f"AND (item_key LIKE 'm3a:%%' OR item_key LIKE 'm3b:%%' "
                f"OR item_key LIKE 'm3c:%%')",
                (date, date),
            )
            handled = [r["item_key"] for r in cur.fetchall()]
        return _json(200, {
            "ok": True,
            "marks": marks,
            "head_tasks": head_tasks,
            "handled_before": handled,
        })
    finally:
        conn.close()


def save_checklist(event: dict, body: dict) -> dict:
    """Сохранить отметку по пункту чек-листа.

    Body: { action: 'checklist', date, item_key, done, comment }
    """
    date = str(body.get("date") or "")[:10]
    item_key = str(body.get("item_key") or "")[:64]
    if len(date) != 10 or not item_key:
        return _json(400, {"error": "date and item_key required"})

    done = bool(body.get("done"))
    comment = str(body.get("comment") or "")[:1000]

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})

            cur.execute(
                f"INSERT INTO {SCHEMA}.shift_checklist "
                f"(shift_date, staff_id, item_key, done, comment) VALUES (%s, %s, %s, %s, %s) "
                f"ON CONFLICT (shift_date, staff_id, item_key) DO UPDATE SET "
                f"done = EXCLUDED.done, comment = EXCLUDED.comment, updated_at = {MSK_NOW}",
                (date, me["id"], item_key, done, comment),
            )
            conn.commit()
        return _json(200, {"ok": True})
    finally:
        conn.close()


# Отметки дашборда общие для всех руководителей и админов: храним их под staff_id = 0
DASH_STAFF = 0


def get_dash(event: dict) -> dict:
    """Общие отметки дашборда за день: что сделано и кем. ?action=dash&date=YYYY-MM-DD"""
    params = event.get("queryStringParameters") or {}
    date = str(params.get("date") or "")[:10]
    if len(date) != 10:
        return _json(400, {"error": "date required"})
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})
            cur.execute(
                f"SELECT item_key, done, comment, done_by, to_char(updated_at, 'HH24:MI') AS at "
                f"FROM {SCHEMA}.shift_checklist WHERE shift_date = %s AND staff_id = %s",
                (date, DASH_STAFF),
            )
            marks = [dict(r) for r in cur.fetchall()]
        return _json(200, {"ok": True, "marks": marks})
    finally:
        conn.close()


def save_dash(event: dict, body: dict) -> dict:
    """Отметка на общем дашборде. Body: { action: 'dash', date, item_key, done, comment }"""
    date = str(body.get("date") or "")[:10]
    item_key = str(body.get("item_key") or "")[:64]
    if len(date) != 10 or not item_key:
        return _json(400, {"error": "date and item_key required"})
    done = bool(body.get("done"))
    comment = str(body.get("comment") or "")[:1000]
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})
            who = " ".join((me.get("full_name") or "").split()[:2]) if done else ""
            cur.execute(
                f"INSERT INTO {SCHEMA}.shift_checklist "
                f"(shift_date, staff_id, item_key, done, comment, done_by) VALUES (%s, %s, %s, %s, %s, %s) "
                f"ON CONFLICT (shift_date, staff_id, item_key) DO UPDATE SET "
                f"done = EXCLUDED.done, comment = EXCLUDED.comment, done_by = EXCLUDED.done_by, "
                f"updated_at = {MSK_NOW}",
                (date, DASH_STAFF, item_key, done, comment, who),
            )
            conn.commit()
        return _json(200, {"ok": True, "done_by": who})
    finally:
        conn.close()


def delete_shift(event: dict) -> dict:
    """Удалить смену: ?id=N либо ?staff_id=N&date=YYYY-MM-DD"""
    params = event.get("queryStringParameters") or {}
    sid = params.get("id")
    staff_id = params.get("staff_id")
    date = params.get("date")

    conn = db_conn()
    try:
        with conn.cursor() as cur:
            if sid:
                cur.execute("DELETE FROM admin_shifts WHERE id = %s", (int(sid),))
            elif staff_id and date:
                cur.execute(
                    "DELETE FROM admin_shifts WHERE staff_id = %s AND shift_date = %s",
                    (int(staff_id), str(date)[:10]),
                )
            else:
                return _json(400, {"error": "id or staff_id+date required"})
            conn.commit()
        return _json(200, {"ok": True})
    finally:
        conn.close()

# ---------- Напоминания об оплате (пункт 3 чек-листа) ----------
# Общие для всех админов: кто бы ни предупредил родителя, остальные видят отметку.
# fingerprint — абонемент ученика (название + дата окончания): после продления
# он меняется, и при следующем «последнем уроке» напоминание понадобится снова.

REMINDER_KINDS = ("m3a", "m3b")
REMINDER_CHANNELS = ("interaction", "ls_messenger", "personal")


def _service_key_ok(event: dict) -> bool:
    key = os.environ.get("INTERACTION_SERVICE_KEY")
    if not key:
        return False
    for name, value in (event.get("headers") or {}).items():
        if str(name).lower() == "x-service-key":
            return str(value or "") == key
    return False


def _reminder_fields(body: dict):
    try:
        cid = int(body.get("crm_customer_id"))
    except (TypeError, ValueError):
        return None
    kind = str(body.get("kind") or "")
    if kind not in REMINDER_KINDS:
        return None
    fp = str(body.get("fingerprint") or "")[:200]
    return cid, kind, fp


def get_reminders(event: dict) -> dict:
    """Отправленные напоминания об оплате за последние 90 дней — для всех админов."""
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if not _me(cur, event):
                return _json(401, {"error": "Требуется вход"})
            cur.execute(
                f"SELECT DISTINCT ON (crm_customer_id, kind, fingerprint) "
                f"id, crm_customer_id, kind, fingerprint, channel, staff_name, "
                f"to_char(sent_at, 'YYYY-MM-DD\"T\"HH24:MI') AS sent_at, "
                f"to_char(sent_at, 'YYYY-MM-DD') AS sent_date "
                f"FROM {SCHEMA}.payment_reminders "
                f"WHERE status = 'sent' AND sent_at >= {MSK_NOW} - interval '90 days' "
                f"ORDER BY crm_customer_id, kind, fingerprint, sent_at DESC",
                (),
            )
            rows = [dict(r) for r in cur.fetchall()]
            cur.execute(
                f"SELECT id, crm_customer_id, kind, fingerprint FROM {SCHEMA}.payment_reminders "
                f"WHERE status = 'draft' AND created_at >= {MSK_NOW} - interval '1 day'",
                (),
            )
            drafts = [dict(r) for r in cur.fetchall()]
        return _json(200, {"ok": True, "reminders": rows, "drafts": drafts})
    finally:
        conn.close()


def reminder_draft(event: dict, body: dict) -> dict:
    """Черновик напоминания перед открытием «Окна»: его id Окно вернёт после отправки."""
    f = _reminder_fields(body)
    if not f:
        return _json(400, {"error": "crm_customer_id and kind required"})
    cid, kind, fp = f
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})
            cur.execute(
                f"INSERT INTO {SCHEMA}.payment_reminders "
                f"(crm_customer_id, kind, fingerprint, status, staff_id, staff_name, student_name, message) "
                f"VALUES (%s, %s, %s, 'draft', %s, %s, %s, %s) RETURNING id",
                (cid, kind, fp, me["id"], me["full_name"],
                 str(body.get("student_name") or "")[:300], str(body.get("message") or "")[:4000]),
            )
            rid = cur.fetchone()["id"]
            conn.commit()
        return _json(200, {"ok": True, "reminder_id": rid})
    finally:
        conn.close()


def reminder_mark(event: dict, body: dict) -> dict:
    """Ручная отметка админа: куда отправлено напоминание (или снять отметку)."""
    f = _reminder_fields(body)
    if not f:
        return _json(400, {"error": "crm_customer_id and kind required"})
    cid, kind, fp = f
    done = bool(body.get("done"))
    channel = str(body.get("channel") or "")
    if done and channel not in REMINDER_CHANNELS:
        return _json(400, {"error": "channel required"})
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})
            if done:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.payment_reminders "
                    f"(crm_customer_id, kind, fingerprint, status, channel, staff_id, staff_name, "
                    f"student_name, sent_at) VALUES (%s, %s, %s, 'sent', %s, %s, %s, %s, {MSK_NOW})",
                    (cid, kind, fp, channel, me["id"], me["full_name"],
                     str(body.get("student_name") or "")[:300]),
                )
            else:
                cur.execute(
                    f"UPDATE {SCHEMA}.payment_reminders SET status = 'cancelled' "
                    f"WHERE crm_customer_id = %s AND kind = %s AND fingerprint = %s "
                    f"AND status IN ('sent', 'draft')",
                    (cid, kind, fp),
                )
            conn.commit()
        return _json(200, {"ok": True})
    finally:
        conn.close()


def reminder_confirm(event: dict, body: dict) -> dict:
    """Ответ «Окна взаимодействия»: сообщение клиенту отправлено.

    Заголовок X-Service-Key = INTERACTION_SERVICE_KEY.
    Body: { action: 'reminder-confirm', reminder_id }
    """
    if not _service_key_ok(event):
        return _json(403, {"error": "Неверный служебный ключ"})
    try:
        rid = int(body.get("reminder_id"))
    except (TypeError, ValueError):
        return _json(400, {"error": "reminder_id required"})
    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.payment_reminders SET status = 'sent', channel = 'interaction', "
                f"sent_at = {MSK_NOW} WHERE id = %s AND status IN ('draft', 'sent') RETURNING id",
                (rid,),
            )
            row = cur.fetchone()
            conn.commit()
        if not row:
            return _json(404, {"error": "Напоминание не найдено"})
        return _json(200, {"ok": True})
    finally:
        conn.close()
