import os
import json
import imaplib
import email
import re
import psycopg2
from email.header import decode_header
from datetime import datetime, timezone
from html.parser import HTMLParser

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

MAIL_HOST = "imap.mail.ru"
MAIL_USER = "abram.viktoriya.00@mail.ru"
SENDER_FILTER = "oplata@tbank.ru"
SUBJECT_FILTER = "оплате заказа"
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def handler(event: dict, context) -> dict:
    """Читает письма Т-Банка об оплатах, сопоставляет по OrderId с заявками в БД и помечает оплаченными"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    debug = params.get("debug") == "1"

    try:
        result = sync_payments(debug=debug)
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(result, ensure_ascii=False),
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {
            "statusCode": 500,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}, ensure_ascii=False),
        }


def sync_payments(debug=False):
    mail_password = os.environ["MAIL_PASSWORD"]
    dsn = os.environ["DATABASE_URL"]

    # 1. Подключаемся к почте по IMAP
    imap = imaplib.IMAP4_SSL(MAIL_HOST)
    imap.login(MAIL_USER, mail_password)
    imap.select("INBOX")

    # 2. Ищем письма от Т-Банка
    status, message_ids = imap.search(None, f'FROM "{SENDER_FILTER}"')
    if status != "OK" or not message_ids[0]:
        imap.logout()
        return {"ok": True, "matched": 0, "already_paid": 0, "not_found": 0}

    ids = message_ids[0].split()
    ids = ids[-500:]  # последние 500 писем

    print(f"Found {len(ids)} emails from {SENDER_FILTER}")

    # 3. Парсим письма
    payments = []
    debug_info = []
    for msg_id in ids:
        _, msg_data = imap.fetch(msg_id, "(RFC822)")
        raw = msg_data[0][1]
        msg = email.message_from_bytes(raw)

        subject_raw = msg.get("Subject", "")
        subject = _decode_header_str(subject_raw)
        if SUBJECT_FILTER.lower() not in subject.lower():
            continue

        date_str = msg.get("Date", "")
        paid_at = _parse_email_date(date_str)

        body_html = _get_body(msg, prefer="html")
        body_text = _get_body(msg, prefer="text")

        # Сначала пробуем найти ORDER_ в plain text
        order_id = _find_order_id(body_text)
        # Если не нашли — чистим HTML и ищем в нём
        if not order_id:
            clean = _html_to_text(body_html)
            order_id = _find_order_id(clean)

        if not order_id:
            # Логируем всегда — чтобы понять что именно не парсится
            clean_for_log = _html_to_text(body_html) or body_text or ""
            print(f"No OrderId | date={date_str} | subject={subject} | body_snippet={clean_for_log[:400]!r}")
            if debug:
                debug_info.append({"subject": subject, "date": date_str, "body_snippet": clean_for_log[:400]})
            continue

        tx_match = re.search(r"ID\s*транзакции[:\s]+(\d+)", body_text or "")
        if not tx_match:
            clean = _html_to_text(body_html)
            tx_match = re.search(r"ID\s*транзакции[:\s]+(\d+)", clean)
        transaction_id = tx_match.group(1) if tx_match else None

        print(f"Parsed: order_id={order_id} tx={transaction_id} date={paid_at}")
        payments.append({"order_id": order_id, "transaction_id": transaction_id, "paid_at": paid_at})

    imap.logout()

    # 4. Обновляем БД
    conn = psycopg2.connect(dsn)
    matched = 0
    already_paid = 0
    not_found = 0
    try:
        with conn.cursor() as cur:
            for p in payments:
                cur.execute(
                    f"SELECT id, paid_at FROM {SCHEMA}.payment_leads WHERE order_id = %s",
                    (p["order_id"],)
                )
                row = cur.fetchone()
                if not row:
                    print(f"Not found in DB: {p['order_id']}")
                    not_found += 1
                    continue
                if row[1] is not None:
                    already_paid += 1
                    continue
                cur.execute(
                    f"UPDATE {SCHEMA}.payment_leads SET paid_at = %s, transaction_id = %s WHERE order_id = %s",
                    (p["paid_at"], p["transaction_id"], p["order_id"])
                )
                print(f"Marked paid: {p['order_id']}")
                matched += 1
        conn.commit()
    finally:
        conn.close()

    result = {"ok": True, "matched": matched, "already_paid": already_paid, "not_found": not_found}
    if debug:
        result["debug"] = debug_info
        result["payments_parsed"] = payments
    return result


def _find_order_id(text: str) -> str | None:
    if not text:
        return None
    # Ищем "OrderId ORDER_XXXXXXXXX" или просто "ORDER_XXXXXXXXX" рядом с "OrderId"
    m = re.search(r"OrderId[\s:]+([A-Z_0-9]+)", text)
    if m:
        return m.group(1)
    # Fallback: любой ORDER_ с числами
    m = re.search(r"\b(ORDER_\d{10,})\b", text)
    if m:
        return m.group(1)
    return None


class _HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        stripped = data.strip()
        if stripped:
            self.parts.append(stripped)

    def get_text(self):
        return " ".join(self.parts)


def _html_to_text(html: str) -> str:
    if not html:
        return ""
    parser = _HTMLTextExtractor()
    parser.feed(html)
    return parser.get_text()


def _decode_header_str(raw: str) -> str:
    parts = decode_header(raw)
    result = []
    for part, enc in parts:
        if isinstance(part, bytes):
            result.append(part.decode(enc or "utf-8", errors="replace"))
        else:
            result.append(part)
    return "".join(result)


def _get_body(msg, prefer="text") -> str:
    """Возвращает тело письма нужного типа. prefer='text' или 'html'."""
    primary_type = f"text/{prefer}"
    secondary_type = "text/html" if prefer == "text" else "text/plain"
    primary_body = ""
    secondary_body = ""

    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            payload = part.get_payload(decode=True)
            if not payload:
                continue
            charset = part.get_content_charset() or "utf-8"
            text = payload.decode(charset, errors="replace")
            if ctype == primary_type:
                primary_body += text
            elif ctype == secondary_type:
                secondary_body += text
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            text = payload.decode(charset, errors="replace")
            if msg.get_content_type() == primary_type:
                primary_body = text
            else:
                secondary_body = text

    return primary_body or secondary_body


def _parse_email_date(date_str: str):
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(date_str)
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()