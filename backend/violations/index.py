import os
import json
import base64
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Authorization",
    "Access-Control-Max-Age": "86400",
}

DDL = """
CREATE TABLE IF NOT EXISTS violations (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    teacher_name VARCHAR(255) NOT NULL,
    violation_date DATE NOT NULL,
    violation_code VARCHAR(50) NOT NULL,
    violation_title TEXT NOT NULL,
    penalty VARCHAR(20),
    admin_comment TEXT,
    dispute_status VARCHAR(20) NOT NULL DEFAULT 'none',
    dispute_comment TEXT,
    dispute_photos JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
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


def _parse_body(event: dict) -> dict:
    return json.loads(event.get("body") or "{}")


def _upload_photos(photos: list) -> list:
    """Загружает фото (base64 data URL) в S3, возвращает список CDN-ссылок."""
    if not photos:
        return []
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    urls = []
    for p in photos:
        if isinstance(p, str) and p.startswith("http"):
            urls.append(p)
            continue
        if not isinstance(p, str) or "," not in p:
            continue
        header, b64 = p.split(",", 1)
        ext = "png"
        ctype = "image/png"
        if "image/jpeg" in header or "image/jpg" in header:
            ext, ctype = "jpg", "image/jpeg"
        elif "image/webp" in header:
            ext, ctype = "webp", "image/webp"
        data = base64.b64decode(b64)
        key = f"violations/{uuid.uuid4().hex}.{ext}"
        s3.put_object(Bucket="files", Key=key, Body=data, ContentType=ctype)
        urls.append(
            f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        )
    return urls


def handler(event: dict, context) -> dict:
    """CRUD дисциплинарных нарушений: GET список (фильтры), POST создать,
    PUT обновить/оспорить, DELETE удалить."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        if method == "GET":
            return list_violations(event)
        if method == "POST":
            return create_violation(event)
        if method == "PUT":
            return update_violation(event)
        if method == "DELETE":
            return delete_violation(event)
        return _json({"error": "method not allowed"}, 405)
    except Exception as e:
        return _json({"error": str(e)}, 500)


def list_violations(event: dict) -> dict:
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
        where.append("violation_date >= %s")
        args.append(date_from)
    if date_to:
        where.append("violation_date <= %s")
        args.append(date_to)

    sql = (
        "SELECT id, teacher_id, teacher_name, violation_date, violation_code, violation_title, "
        "penalty, admin_comment, dispute_status, dispute_comment, dispute_photos, "
        "created_at, updated_at FROM violations"
    )
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY violation_date DESC, id DESC"

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
        if isinstance(d.get("dispute_photos"), str):
            d["dispute_photos"] = json.loads(d["dispute_photos"])
        items.append(d)
    return _json({"items": items})


def create_violation(event: dict) -> dict:
    data = _parse_body(event)
    teacher_id = data.get("teacher_id")
    teacher_name = (data.get("teacher_name") or "").strip()
    violation_date = data.get("violation_date")
    violation_code = (data.get("violation_code") or "").strip()
    violation_title = (data.get("violation_title") or "").strip()

    if not teacher_id or not teacher_name:
        return _json({"error": "teacher required"}, 400)
    if not violation_date:
        return _json({"error": "violation_date required"}, 400)
    if not violation_code or not violation_title:
        return _json({"error": "violation type required"}, 400)

    conn = db()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        ensure_table(cur)
        cur.execute(
            "INSERT INTO violations (teacher_id, teacher_name, violation_date, violation_code, "
            "violation_title, penalty, admin_comment) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                int(teacher_id),
                teacher_name,
                violation_date,
                violation_code,
                violation_title,
                (data.get("penalty") or "").strip() or None,
                (data.get("admin_comment") or "").strip() or None,
            ),
        )
        new_id = cur.fetchone()["id"]
        conn.commit()
    conn.close()
    return _json({"ok": True, "id": new_id})


def update_violation(event: dict) -> dict:
    data = _parse_body(event)
    vid = data.get("id")
    if not vid:
        return _json({"error": "id required"}, 400)

    # Оспаривание педагогом — комментарий + фото.
    if data.get("action") == "dispute":
        photos = _upload_photos(data.get("photos") or [])
        conn = db()
        with conn.cursor() as cur:
            ensure_table(cur)
            cur.execute(
                "UPDATE violations SET dispute_status = 'disputed', dispute_comment = %s, "
                "dispute_photos = %s, updated_at = NOW() WHERE id = %s",
                (
                    (data.get("dispute_comment") or "").strip() or None,
                    json.dumps(photos, ensure_ascii=False),
                    int(vid),
                ),
            )
            conn.commit()
        conn.close()
        return _json({"ok": True, "id": vid, "dispute_photos": photos})

    # Редактирование администратором.
    conn = db()
    with conn.cursor() as cur:
        ensure_table(cur)
        cur.execute(
            "UPDATE violations SET teacher_id = %s, teacher_name = %s, violation_date = %s, "
            "violation_code = %s, violation_title = %s, penalty = %s, admin_comment = %s, "
            "updated_at = NOW() WHERE id = %s",
            (
                int(data.get("teacher_id")),
                (data.get("teacher_name") or "").strip(),
                data.get("violation_date"),
                (data.get("violation_code") or "").strip(),
                (data.get("violation_title") or "").strip(),
                (data.get("penalty") or "").strip() or None,
                (data.get("admin_comment") or "").strip() or None,
                int(vid),
            ),
        )
        conn.commit()
    conn.close()
    return _json({"ok": True, "id": vid})


def delete_violation(event: dict) -> dict:
    params = event.get("queryStringParameters") or {}
    vid = params.get("id")
    if not vid:
        return _json({"error": "id required"}, 400)
    conn = db()
    with conn.cursor() as cur:
        ensure_table(cur)
        cur.execute("DELETE FROM violations WHERE id = %s", (int(vid),))
        conn.commit()
    conn.close()
    return _json({"ok": True, "id": vid})
