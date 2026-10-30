import os
import json
import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, X-Service-Key",
    "Access-Control-Max-Age": "86400",
}

SCHEMA = "t_p93118852_lineaschool_initiati"


def _json(status, payload):
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False, default=str),
    }


def db_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _only_digits(phone) -> str:
    d = "".join(c for c in str(phone or "") if c.isdigit())
    if len(d) == 11 and d.startswith("8"):
        d = "7" + d[1:]
    return d


def _header(event, name):
    for k, v in (event.get("headers") or {}).items():
        if str(k).lower() == name.lower():
            return str(v or "")
    return ""


def _me(cur, event):
    token = _header(event, "X-Auth-Token")
    if not token:
        return None
    cur.execute(
        f"SELECT s.id, s.full_name, s.role, s.phone FROM {SCHEMA}.staff_sessions ss "
        f"JOIN {SCHEMA}.staff s ON s.id = ss.staff_id "
        f"WHERE ss.token = %s AND ss.expires_at > now() AND s.status = 'active'",
        (token,),
    )
    row = cur.fetchone()
    return dict(row) if row else None


def _valid_date(s: str) -> bool:
    try:
        datetime.date.fromisoformat(s)
        return True
    except ValueError:
        return False


def handler(event: dict, context) -> dict:
    """KPI администраторов: приём скорости ответа из «Окна взаимодействия» и выдача показателей по месяцам"""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    act = str(params.get("action") or "")

    if method == "POST" and act == "response-hook":
        return response_hook(event)
    if method == "GET" and act == "response":
        return get_response(event, params)
    return _json(400, {"error": "unknown action"})


def response_hook(event: dict) -> dict:
    """Окно присылает скорость ответа админов по дням.

    Заголовок X-Service-Key = INTERACTION_SERVICE_KEY.
    Body: {"days":[{"date":"2026-10-05","phone":"79…","name":"…","dialogs":12,"avg_minutes":8.5}]}
    Повторная отправка того же дня перезаписывает его.
    """
    key = os.environ.get("INTERACTION_SERVICE_KEY")
    if not key or _header(event, "X-Service-Key") != key:
        return _json(403, {"error": "Неверный служебный ключ"})
    body = json.loads(event.get("body") or "{}")
    days = body.get("days") or []
    if not isinstance(days, list):
        return _json(400, {"error": "days must be a list"})

    conn = db_conn()
    saved, skipped = 0, []
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f"SELECT id, full_name, phone FROM {SCHEMA}.staff")
            by_phone = {_only_digits(r["phone"]): r for r in cur.fetchall() if r["phone"]}
            for d in days:
                phone = _only_digits(d.get("phone"))
                date = str(d.get("date") or "")[:10]
                try:
                    dialogs = int(d.get("dialogs") or 0)
                    avg = float(d.get("avg_minutes") or 0)
                except (TypeError, ValueError):
                    skipped.append(d)
                    continue
                if not phone or not _valid_date(date) or dialogs < 0 or avg < 0:
                    skipped.append(d)
                    continue
                staff = by_phone.get(phone)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.admin_response_stats "
                    f"(phone, staff_id, staff_name, stat_date, dialogs, total_minutes, updated_at) "
                    f"VALUES (%s, %s, %s, %s, %s, %s, now()) "
                    f"ON CONFLICT (phone, stat_date) DO UPDATE SET staff_id = EXCLUDED.staff_id, "
                    f"staff_name = EXCLUDED.staff_name, dialogs = EXCLUDED.dialogs, "
                    f"total_minutes = EXCLUDED.total_minutes, updated_at = now()",
                    (
                        phone,
                        staff["id"] if staff else None,
                        staff["full_name"] if staff else (d.get("name") or None),
                        date,
                        dialogs,
                        round(avg * dialogs, 2),
                    ),
                )
                saved += 1
        conn.commit()
    finally:
        conn.close()
    print(f"response-hook saved={saved} skipped={len(skipped)}")
    return _json(200, {"ok": True, "saved": saved, "skipped": len(skipped)})


def get_response(event: dict, params: dict) -> dict:
    """Скорость ответа по месяцам: ?action=response&from=YYYY-MM-DD&to=YYYY-MM-DD[&scope=all]

    scope=all — по всем сотрудникам, только для руководителя. Иначе — свои показатели.
    """
    d_from = str(params.get("from") or "")[:10]
    d_to = str(params.get("to") or "")[:10]
    if not _valid_date(d_from) or not _valid_date(d_to):
        return _json(400, {"error": "from и to нужны в формате YYYY-MM-DD"})

    conn = db_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            me = _me(cur, event)
            if not me:
                return _json(401, {"error": "Требуется вход"})
            all_scope = params.get("scope") == "all"
            if all_scope and me["role"] != "head":
                return _json(403, {"error": "Сводка доступна только руководителю"})

            where = "stat_date BETWEEN %s::date AND %s::date"
            args = [d_from, d_to]
            if not all_scope:
                where += " AND (staff_id = %s OR phone = %s)"
                args += [me["id"], _only_digits(me["phone"])]
            cur.execute(
                f"SELECT staff_id, phone, max(staff_name) AS staff_name, "
                f"to_char(stat_date, 'YYYY-MM') AS month, "
                f"sum(dialogs) AS dialogs, sum(total_minutes) AS total_minutes, count(*) AS days "
                f"FROM {SCHEMA}.admin_response_stats WHERE {where} "
                f"GROUP BY staff_id, phone, month ORDER BY month",
                tuple(args),
            )
            rows = []
            for r in cur.fetchall():
                dialogs = int(r["dialogs"] or 0)
                total = float(r["total_minutes"] or 0)
                rows.append({
                    "staff_id": r["staff_id"],
                    "phone": r["phone"],
                    "staff_name": r["staff_name"],
                    "month": r["month"],
                    "dialogs": dialogs,
                    "total_minutes": round(total, 2),
                    "days": int(r["days"]),
                })
            cur.execute(
                f"SELECT to_char(max(updated_at) + interval '3 hours', 'YYYY-MM-DD\"T\"HH24:MI:SS') AS t "
                f"FROM {SCHEMA}.admin_response_stats"
            )
            last = cur.fetchone()["t"]
        return _json(200, {"ok": True, "from": d_from, "to": d_to, "rows": rows, "updated_at": last})
    finally:
        conn.close()