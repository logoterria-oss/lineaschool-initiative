import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Authorization",
    "Access-Control-Max-Age": "86400",
}

DDL = """
CREATE TABLE IF NOT EXISTS supervisions (
    id SERIAL PRIMARY KEY,
    lesson_form VARCHAR(20) NOT NULL,
    teacher_id INTEGER NOT NULL,
    teacher_name VARCHAR(255) NOT NULL,
    supervision_date DATE NOT NULL,
    lesson_date DATE,
    lesson_link TEXT,
    lesson_structure TEXT,
    scores JSONB NOT NULL DEFAULT '{}',
    reviewer_comment TEXT,
    total_score INTEGER NOT NULL DEFAULT 0,
    student_id INTEGER,
    student_name VARCHAR(255),
    student_age INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE supervisions ADD COLUMN IF NOT EXISTS student_id INTEGER;
ALTER TABLE supervisions ADD COLUMN IF NOT EXISTS student_name VARCHAR(255);
ALTER TABLE supervisions ADD COLUMN IF NOT EXISTS student_age INTEGER;
ALTER TABLE supervisions ADD COLUMN IF NOT EXISTS group_size INTEGER;
"""


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _json(payload, code=200):
    return {
        "statusCode": code,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False, default=str),
    }


def ensure_table(cur):
    cur.execute(DDL)


def _total(scores: dict) -> int:
    total = 0
    for v in (scores or {}).values():
        try:
            total += int(v)
        except (TypeError, ValueError):
            pass
    return total


def handler(event: dict, context) -> dict:
    """CRUD супервизий: GET список (с фильтрами), POST создать, PUT обновить, DELETE удалить."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        if method == "GET":
            params = event.get("queryStringParameters") or {}
            if params.get("cleanup") == "test":
                return cleanup_test()
            return list_supervisions(event)
        if method == "POST":
            body = _parse_body(event)
            if body.get("action") == "delete":
                return delete_by_id(body.get("id"))
            return create_supervision(event)
        if method == "PUT":
            return update_supervision(event)
        if method == "DELETE":
            return delete_supervision(event)
        return _json({"error": "method not allowed"}, 405)
    except Exception as e:
        return _json({"error": str(e)}, 500)


def list_supervisions(event: dict) -> dict:
    params = event.get("queryStringParameters") or {}
    teacher_id = params.get("teacher_id")
    date_from = params.get("date_from")
    date_to = params.get("date_to")

    where = []
    args = []
    if teacher_id:
        where.append("teacher_id = %s")
        args.append(int(teacher_id))
    if date_from:
        where.append("supervision_date >= %s")
        args.append(date_from)
    if date_to:
        where.append("supervision_date <= %s")
        args.append(date_to)

    sql = (
        "SELECT id, lesson_form, teacher_id, teacher_name, supervision_date, lesson_date, "
        "lesson_link, lesson_structure, scores, reviewer_comment, total_score, "
        "student_id, student_name, student_age, group_size, created_at, updated_at "
        "FROM supervisions"
    )
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY supervision_date DESC, id DESC"

    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        ensure_table(cur)
        cur.execute(sql, args)
        rows = cur.fetchall()
        conn.commit()
    conn.close()

    items = []
    for r in rows:
        d = dict(r)
        if isinstance(d.get("scores"), str):
            d["scores"] = json.loads(d["scores"])
        items.append(d)
    return _json({"items": items})


def _parse_body(event: dict) -> dict:
    raw = event.get("body") or "{}"
    return json.loads(raw)


def create_supervision(event: dict) -> dict:
    data = _parse_body(event)

    lesson_form = (data.get("lesson_form") or "").strip()
    teacher_id = data.get("teacher_id")
    teacher_name = (data.get("teacher_name") or "").strip()
    supervision_date = data.get("supervision_date")
    if lesson_form not in ("group", "individual"):
        return _json({"error": "lesson_form must be group or individual"}, 400)
    if not teacher_id or not teacher_name:
        return _json({"error": "teacher required"}, 400)
    if not supervision_date:
        return _json({"error": "supervision_date required"}, 400)

    scores = data.get("scores") or {}
    total = _total(scores)

    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        ensure_table(cur)
        cur.execute(
            "INSERT INTO supervisions (lesson_form, teacher_id, teacher_name, supervision_date, "
            "lesson_date, lesson_link, lesson_structure, scores, reviewer_comment, total_score, "
            "student_id, student_name, student_age, group_size) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                lesson_form,
                int(teacher_id),
                teacher_name,
                supervision_date,
                data.get("lesson_date") or None,
                data.get("lesson_link") or None,
                data.get("lesson_structure") or None,
                json.dumps(scores, ensure_ascii=False),
                data.get("reviewer_comment") or None,
                total,
                data.get("student_id") or None,
                (data.get("student_name") or "").strip() or None,
                data.get("student_age") if data.get("student_age") is not None else None,
                data.get("group_size") if data.get("group_size") is not None else None,
            ),
        )
        new_id = cur.fetchone()["id"]
        conn.commit()
    conn.close()
    return _json({"ok": True, "id": new_id, "total_score": total})


def update_supervision(event: dict) -> dict:
    data = _parse_body(event)
    sup_id = data.get("id")
    if not sup_id:
        return _json({"error": "id required"}, 400)

    scores = data.get("scores") or {}
    total = _total(scores)

    conn = db()
    with conn.cursor() as cur:
        ensure_table(cur)
        cur.execute(
            "UPDATE supervisions SET lesson_form = %s, teacher_id = %s, teacher_name = %s, "
            "supervision_date = %s, lesson_date = %s, lesson_link = %s, lesson_structure = %s, "
            "scores = %s, reviewer_comment = %s, total_score = %s, "
            "student_id = %s, student_name = %s, student_age = %s, group_size = %s, updated_at = NOW() "
            "WHERE id = %s",
            (
                data.get("lesson_form"),
                int(data.get("teacher_id")),
                (data.get("teacher_name") or "").strip(),
                data.get("supervision_date"),
                data.get("lesson_date") or None,
                data.get("lesson_link") or None,
                data.get("lesson_structure") or None,
                json.dumps(scores, ensure_ascii=False),
                data.get("reviewer_comment") or None,
                total,
                data.get("student_id") or None,
                (data.get("student_name") or "").strip() or None,
                data.get("student_age") if data.get("student_age") is not None else None,
                data.get("group_size") if data.get("group_size") is not None else None,
                int(sup_id),
            ),
        )
        conn.commit()
    conn.close()
    return _json({"ok": True, "id": sup_id, "total_score": total})


def cleanup_test() -> dict:
    conn = db()
    with conn.cursor() as cur:
        ensure_table(cur)
        cur.execute("DELETE FROM supervisions WHERE lesson_link = 'https://example.com/lesson'")
        deleted = cur.rowcount
        conn.commit()
    conn.close()
    return _json({"ok": True, "deleted": deleted})


def delete_by_id(sup_id) -> dict:
    if not sup_id:
        return _json({"error": "id required"}, 400)
    conn = db()
    with conn.cursor() as cur:
        ensure_table(cur)
        cur.execute("DELETE FROM supervisions WHERE id = %s", (int(sup_id),))
        conn.commit()
    conn.close()
    return _json({"ok": True})


def delete_supervision(event: dict) -> dict:
    params = event.get("queryStringParameters") or {}
    sup_id = params.get("id")
    if not sup_id:
        data = _parse_body(event)
        sup_id = data.get("id")
    return delete_by_id(sup_id)