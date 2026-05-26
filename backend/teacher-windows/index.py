import os
import json
import re
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, X-Authorization",
    "Access-Control-Max-Age": "86400",
}


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def normalize_name(name: str) -> str:
    s = (name or "").strip().lower()
    s = s.replace("ё", "е")
    s = re.sub(r"\s+", " ", s)
    return s


def _json(payload, code=200):
    return {
        "statusCode": code,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False, default=str),
    }


def handler(event: dict, context) -> dict:
    """Свободные слоты педагогов. POST сохраняет (нужен X-Api-Key), GET читает по ФИО."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        if method == "GET":
            return get_slots(event)
        if method == "POST":
            return save_slots(event)
        return _json({"error": "method not allowed"}, 405)
    except Exception as e:
        return _json({"error": str(e)}, 500)


def _fmt(t):
    return t.strftime("%H:%M") if hasattr(t, "strftime") else str(t)[:5]


def _empty_week():
    return {i: [] for i in range(1, 8)}


def get_slots(event: dict) -> dict:
    params = event.get("queryStringParameters") or {}
    name = params.get("name") or params.get("teacher_name") or ""

    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if name:
            norm = normalize_name(name)
            cur.execute(
                "SELECT weekday, slot_time FROM teacher_windows "
                "WHERE teacher_name_normalized = %s AND slot_time IS NOT NULL "
                "ORDER BY weekday, slot_time",
                (norm,),
            )
            rows = cur.fetchall()
            conn.close()
            week = _empty_week()
            for r in rows:
                week[int(r["weekday"])].append(_fmt(r["slot_time"]))
            return _json({"teacher_name": name, "slots_by_weekday": week})

        cur.execute(
            "SELECT teacher_name, weekday, slot_time FROM teacher_windows "
            "WHERE slot_time IS NOT NULL "
            "ORDER BY teacher_name, weekday, slot_time"
        )
        rows = cur.fetchall()
    conn.close()

    grouped = {}
    for r in rows:
        nm = r["teacher_name"]
        grouped.setdefault(nm, _empty_week())
        grouped[nm][int(r["weekday"])].append(_fmt(r["slot_time"]))
    return _json({"teachers": grouped})


def _parse_slots_payload(data: dict):
    out = []
    if "slots_by_weekday" in data:
        for wd_key, times in (data.get("slots_by_weekday") or {}).items():
            wd = int(wd_key)
            for t in times or []:
                out.append((wd, str(t)))
    elif "slots" in data:
        for s in data.get("slots") or []:
            out.append((int(s.get("weekday")), str(s.get("time") or s.get("slot_time"))))
    return out


def save_slots(event: dict) -> dict:
    headers = event.get("headers") or {}
    api_key = (
        headers.get("X-Api-Key")
        or headers.get("x-api-key")
        or headers.get("X-Authorization")
        or headers.get("x-authorization")
        or ""
    )
    expected = os.environ.get("TEACHER_WINDOWS_API_KEY", "")
    if not expected or api_key != expected:
        return _json({"error": "unauthorized"}, 401)

    raw = event.get("body") or "{}"
    try:
        data = json.loads(raw)
    except Exception:
        return _json({"error": "invalid json"}, 400)

    name = (data.get("teacher_name") or "").strip()
    if not name:
        return _json({"error": "teacher_name required"}, 400)

    pairs = _parse_slots_payload(data)
    norm = normalize_name(name)

    seen = set()
    rows = []
    for wd, t in pairs:
        if not (1 <= wd <= 7):
            return _json({"error": f"weekday must be 1..7, got {wd}"}, 400)
        if not re.match(r"^\d{1,2}:\d{2}(:\d{2})?$", t):
            return _json({"error": f"bad time: {t}"}, 400)
        key = (wd, t)
        if key in seen:
            continue
        seen.add(key)
        rows.append((name, norm, wd, t))

    conn = db()
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE teacher_windows SET slot_time = NULL, "
            "teacher_name_normalized = teacher_name_normalized || '_old_' || id::text "
            "WHERE teacher_name_normalized = %s",
            (norm,),
        )
        for r in rows:
            cur.execute(
                "INSERT INTO teacher_windows (teacher_name, teacher_name_normalized, weekday, slot_time) "
                "VALUES (%s, %s, %s, %s) "
                "ON CONFLICT (teacher_name_normalized, weekday, slot_time) DO NOTHING",
                r,
            )
        conn.commit()
    conn.close()

    return _json({"ok": True, "saved": len(rows), "teacher_name": name})
