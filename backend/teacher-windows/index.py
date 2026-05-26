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
    """Окна педагогов: POST сохраняет (только с API-ключом), GET читает по ФИО."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        if method == "GET":
            return get_windows(event)
        if method == "POST":
            return save_windows(event)
        return _json({"error": "method not allowed"}, 405)
    except Exception as e:
        return _json({"error": str(e)}, 500)


def get_windows(event: dict) -> dict:
    params = event.get("queryStringParameters") or {}
    name = params.get("name") or params.get("teacher_name") or ""
    if not name:
        conn = db()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT teacher_name, weekday, time_from, time_to, comment, updated_at "
                "FROM teacher_windows ORDER BY teacher_name, weekday, time_from"
            )
            rows = cur.fetchall()
        conn.close()
        return _json({"windows": rows})

    norm = normalize_name(name)
    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT teacher_name, weekday, time_from, time_to, comment, updated_at "
            "FROM teacher_windows WHERE teacher_name_normalized = %s "
            "ORDER BY weekday, time_from",
            (norm,),
        )
        rows = cur.fetchall()
    conn.close()
    return _json({"teacher_name": name, "windows": rows})


def save_windows(event: dict) -> dict:
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
    windows = data.get("windows") or []
    if not name:
        return _json({"error": "teacher_name required"}, 400)
    if not isinstance(windows, list):
        return _json({"error": "windows must be array"}, 400)

    norm = normalize_name(name)
    rows = []
    for w in windows:
        try:
            wd = int(w.get("weekday"))
            tf = str(w.get("time_from"))
            tt = str(w.get("time_to"))
        except Exception:
            return _json({"error": f"bad window: {w}"}, 400)
        if not (1 <= wd <= 7):
            return _json({"error": f"weekday must be 1..7, got {wd}"}, 400)
        rows.append((name, norm, wd, tf, tt, w.get("comment")))

    conn = db()
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM teacher_windows WHERE teacher_name_normalized = %s",
            (norm,),
        )
        for r in rows:
            cur.execute(
                "INSERT INTO teacher_windows "
                "(teacher_name, teacher_name_normalized, weekday, time_from, time_to, comment) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                r,
            )
        conn.commit()
    conn.close()

    return _json({"ok": True, "saved": len(rows), "teacher_name": name})
