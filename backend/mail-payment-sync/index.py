import os
import json
import imaplib
import email
import re
import psycopg2
from email.header import decode_header
from datetime import datetime, timezone

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

    try:
        matched, already_paid, not_found = sync_payments()
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({
                "ok": True,
                "matched": matched,
                "already_paid": already_paid,
                "not_found": not_found,
            }, ensure_ascii=False),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}, ensure_ascii=False),
        }


def sync_payments():
    """Основная логика синхронизации"""
    mail_password = os.environ["MAIL_PASSWORD"]
    dsn = os.environ["DATABASE_URL"]

    # 1. Подключаемся к почте по IMAP
    imap = imaplib.IMAP4_SSL(MAIL_HOST)
    imap.login(MAIL_USER, mail_password)
    imap.select("INBOX")

    # 2. Ищем письма от Т-Банка за последние 30 дней
    status, message_ids = imap.search(None, f'FROM "{SENDER_FILTER}"')
    if status != "OK" or not message_ids[0]:
        imap.logout()
        return 0, 0, 0

    ids = message_ids[0].split()
    # Берём последние 100 писем максимум
    ids = ids[-100:]

    # 3. Парсим письма, извлекаем OrderId и дату
    payments = []  # [{order_id, transaction_id, paid_at}]
    for msg_id in ids:
        _, msg_data = imap.fetch(msg_id, "(RFC822)")
        raw = msg_data[0][1]
        msg = email.message_from_bytes(raw)

        # Проверяем тему
        subject_raw = msg.get("Subject", "")
        subject = _decode_header_str(subject_raw)
        if SUBJECT_FILTER.lower() not in subject.lower():
            continue

        # Дата письма
        date_str = msg.get("Date", "")
        paid_at = _parse_email_date(date_str)

        # Извлекаем текст письма
        body = _get_body(msg)

        # Парсим OrderId
        order_match = re.search(r"OrderId\s+(ORDER_\d+)", body)
        if not order_match:
            # Иногда может быть в виде "ORDER_XXXXXXXXX" просто в тексте
            order_match = re.search(r"(ORDER_\d+)", body)
        if not order_match:
            continue
        order_id = order_match.group(1)

        # Парсим ID транзакции
        tx_match = re.search(r"ID\s+транзакции\s+(\d+)", body)
        transaction_id = tx_match.group(1) if tx_match else None

        payments.append({
            "order_id": order_id,
            "transaction_id": transaction_id,
            "paid_at": paid_at,
        })

    imap.logout()

    if not payments:
        return 0, 0, 0

    # 4. Обновляем БД
    conn = psycopg2.connect(dsn)
    matched = 0
    already_paid = 0
    not_found = 0
    try:
        with conn.cursor() as cur:
            for p in payments:
                # Проверяем, есть ли такая заявка
                cur.execute(
                    f"SELECT id, paid_at FROM {SCHEMA}.payment_leads WHERE order_id = %s",
                    (p["order_id"],)
                )
                row = cur.fetchone()
                if not row:
                    not_found += 1
                    continue
                if row[1] is not None:
                    already_paid += 1
                    continue
                # Помечаем оплаченной
                cur.execute(
                    f"UPDATE {SCHEMA}.payment_leads SET paid_at = %s, transaction_id = %s WHERE order_id = %s",
                    (p["paid_at"], p["transaction_id"], p["order_id"])
                )
                matched += 1
        conn.commit()
    finally:
        conn.close()

    return matched, already_paid, not_found


def _decode_header_str(raw: str) -> str:
    parts = decode_header(raw)
    result = []
    for part, enc in parts:
        if isinstance(part, bytes):
            result.append(part.decode(enc or "utf-8", errors="replace"))
        else:
            result.append(part)
    return "".join(result)


def _get_body(msg) -> str:
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            if ctype in ("text/plain", "text/html"):
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    body += payload.decode(charset, errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            body = payload.decode(charset, errors="replace")
    return body


def _parse_email_date(date_str: str):
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(date_str)
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    except Exception:
        return datetime.utcnow()
