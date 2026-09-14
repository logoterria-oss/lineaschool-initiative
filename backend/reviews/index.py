import os
import json
import secrets as pysecrets
import psycopg2
from psycopg2.extras import RealDictCursor

"""
Приём отзывов от мессенджера и выдача их в админку.

Мессенджер присылает отзыв POST-запросом с ключом в заголовке X-Api-Key.
Структура полей ещё уточняется, поэтому тело запроса сохраняем целиком
в payload — ничего не потеряется, когда мессенджер начнёт присылать
новые поля.

Направления (kind):
  improve     — «Что улучшить»
  free_lesson — «Бесплатный урок за отзыв»
"""

SCHEMA = "t_p93118852_lineaschool_initiati"
KINDS = ("improve", "free_lesson")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, X-Auth-Token",
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


def _api_key_ok(event) -> bool:
    """Ключ мессенджера: без него отзывы принимать нельзя."""
    expected = os.environ.get("REVIEWS_API_KEY") or ""
    if not expected:
        return False
    headers = event.get("headers") or {}
    got = headers.get("X-Api-Key") or headers.get("x-api-key") or ""
    return pysecrets.compare_digest(str(got), expected)


def _staff_ok(cur, event) -> bool:
    """Сотрудник админки — по токену входа."""
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
    if not token:
        return False
    cur.execute(
        "SELECT 1 FROM staff_sessions ss JOIN staff s ON s.id = ss.staff_id "
        "WHERE ss.token = %s AND ss.expires_at > now() AND s.status = 'active'",
        (token,),
    )
    return cur.fetchone() is not None


def _pick(body, *names):
    """Первое непустое значение из возможных названий поля.

    Мессенджер может присылать name/author/client_name — принимаем любое,
    чтобы интеграция не ломалась из-за разницы в названиях.
    """
    for n in names:
        v = body.get(n)
        if v not in (None, ""):
            return str(v).strip()
    return ""


def handle_create(event, body):
    """Принять отзыв от мессенджера."""
    if not _api_key_ok(event):
        return _json(401, {"error": "Неверный ключ доступа"})

    kind = str(body.get("kind") or "improve").strip()
    if kind not in KINDS:
        return _json(400, {"error": f"kind должен быть одним из {', '.join(KINDS)}"})

    text = _pick(body, "text", "review", "message", "comment")
    author = _pick(body, "author_name", "name", "author", "client_name")
    phone = _pick(body, "phone", "contact", "tel")

    rating = body.get("rating")
    try:
        rating = int(rating) if rating not in (None, "") else None
    except (TypeError, ValueError):
        rating = None

    conn = db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                f"INSERT INTO {SCHEMA}.reviews "
                f"(kind, author_name, phone, text, rating, payload, source) "
                f"VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s) "
                f"RETURNING id, to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS created_at",
                (kind, author, phone, text, rating,
                 json.dumps(body, ensure_ascii=False),
                 str(body.get("source") or "messenger")[:50]),
            )
            row = dict(cur.fetchone())
            conn.commit()
        return _json(200, {"ok": True, **row})
    finally:
        conn.close()


def handle_list(event):
    """Список отзывов для админки: ?kind=improve|free_lesson."""
    params = event.get("queryStringParameters") or {}
    kind = str(params.get("kind") or "").strip()

    conn = db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if not _staff_ok(cur, event):
                return _json(401, {"error": "Требуется вход"})

            sql = (
                f"SELECT id, kind, author_name, phone, text, rating, status, source, payload, "
                f"to_char(created_at, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS created_at "
                f"FROM {SCHEMA}.reviews "
            )
            if kind in KINDS:
                cur.execute(sql + "WHERE kind = %s ORDER BY created_at DESC", (kind,))
            else:
                cur.execute(sql + "ORDER BY created_at DESC")
            rows = [dict(r) for r in cur.fetchall()]
        return _json(200, {"ok": True, "reviews": rows, "count": len(rows)})
    finally:
        conn.close()


def handler(event: dict, context) -> dict:
    """Отзывы с сайта и мессенджера: приём по API и список для админки"""
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        if method == "GET":
            return handle_list(event)
        if method == "POST":
            return handle_create(event, json.loads(event.get("body") or "{}"))
        return _json(405, {"error": "Method not allowed"})
    except Exception as e:
        print(f"reviews failed: {e}")
        return _json(500, {"error": str(e)})
