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

TABLE = "letterhead_docs"


def _json(payload, code=200):
    return {
        "statusCode": code,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False, default=str),
    }


def _esc(v) -> str:
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def _upload_pdf(b64: str, file_name: str) -> str:
    raw = base64.b64decode(b64.split(",")[-1])
    key = f"letterhead/{uuid.uuid4().hex}.pdf"
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(
        Bucket="files",
        Key=key,
        Body=raw,
        ContentType="application/pdf",
        ContentDisposition=f'inline; filename="{uuid.uuid4().hex}.pdf"',
    )
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """Хранилище официальных документов на фирменном бланке: список, сохранение PDF в S3, удаление."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if method == "GET":
        cur.execute(
            f"SELECT id, title, doc_number, doc_date, recipient, body, signer_post, "
            f"signer_name, city, stamp_mode, file_name, pdf_url, created_by, created_at "
            f"FROM {TABLE} ORDER BY created_at DESC LIMIT 300"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return _json({"docs": [dict(r) for r in rows]})

    if method == "POST":
        d = json.loads(event.get("body") or "{}")
        pdf_url = ""
        if d.get("pdfBase64"):
            pdf_url = _upload_pdf(d["pdfBase64"], d.get("fileName", "doc.pdf"))
        doc_date = d.get("docDate") or None
        cur.execute(
            f"INSERT INTO {TABLE} (title, doc_number, doc_date, recipient, body, signer_post, "
            f"signer_name, city, stamp_mode, file_name, pdf_url, created_by) VALUES ("
            f"{_esc(d.get('title', ''))}, {_esc(d.get('docNumber', ''))}, "
            f"{_esc(doc_date) if doc_date else 'NULL'}, {_esc(d.get('recipient', ''))}, "
            f"{_esc(d.get('body', ''))}, {_esc(d.get('signerPost', ''))}, "
            f"{_esc(d.get('signerName', ''))}, {_esc(d.get('city', ''))}, "
            f"{_esc(d.get('stampMode', 'none'))}, {_esc(d.get('fileName', ''))}, "
            f"{_esc(pdf_url)}, {_esc(d.get('createdBy', ''))}) RETURNING id"
        )
        new_id = cur.fetchone()["id"]
        cur.close()
        conn.close()
        return _json({"success": True, "id": new_id, "pdfUrl": pdf_url})

    if method == "DELETE":
        qs = event.get("queryStringParameters") or {}
        doc_id = qs.get("id")
        if not doc_id or not str(doc_id).isdigit():
            cur.close()
            conn.close()
            return _json({"error": "id required"}, 400)
        cur.execute(f"DELETE FROM {TABLE} WHERE id = {int(doc_id)}")
        cur.close()
        conn.close()
        return _json({"success": True})

    cur.close()
    conn.close()
    return _json({"error": "method not allowed"}, 405)
