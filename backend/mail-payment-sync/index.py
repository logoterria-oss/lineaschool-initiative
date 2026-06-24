import os
import json
import imaplib
import email
import re
import psycopg2
from email.header import decode_header
from datetime import datetime, timezone, timedelta
from html.parser import HTMLParser

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

MAIL_HOST = "imap.mail.ru"
MAIL_USER = "abram.viktoriya.00@mail.ru"
SENDER_FILTER = "oplata@tbank.ru"
FOLDERS_TO_CHECK = ["INBOX", "INBOX/Receipts", "Receipts"]
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
SEARCH_DAYS = 14


def handler(event: dict, context) -> dict:
    """Читает письма Т-Банка об оплатах, сопоставляет по OrderId и помечает заявки оплаченными"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    debug_order = params.get("debug")
    if debug_order:
        try:
            result = debug_order_search(debug_order)
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

    try:
        result = sync_payments()
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


def sync_payments():
    mail_password = os.environ["MAIL_PASSWORD"]
    dsn = os.environ["DATABASE_URL"]

    # Берём только незакрытые заявки — только их ищем в почте
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT order_id FROM {SCHEMA}.payment_leads WHERE paid_at IS NULL")
            unpaid_orders = {row[0] for row in cur.fetchall()}
            # Чёрный список: заявки/транзакции, удалённые вручную — их не воскрешаем
            cur.execute(f"SELECT order_id, transaction_id FROM {SCHEMA}.payment_blocklist")
            blocked_orders = set()
            blocked_tx = set()
            for o, t in cur.fetchall():
                if o:
                    blocked_orders.add(o)
                if t:
                    blocked_tx.add(t)
            # Замороженные (сверённые с бухгалтером) месяцы — в них оплаты не проставляем
            cur.execute(f"SELECT month FROM {SCHEMA}.closed_months")
            closed_months = {row[0] for row in cur.fetchall()}
    finally:
        conn.close()

    # Исключаем заблокированные order_id из поиска
    unpaid_orders -= blocked_orders

    print(f"Unpaid orders to match: {len(unpaid_orders)}")
    if not unpaid_orders:
        return {"ok": True, "matched": 0, "already_paid": 0, "not_found": 0}

    imap = imaplib.IMAP4_SSL(MAIL_HOST)
    imap.login(MAIL_USER, mail_password)

    # Один пакетный поиск свежих писем от банка, дальше сопоставляем локально.
    # Так мы НЕ делаем отдельный IMAP-запрос на каждую заявку (это и было тормозом).
    since_date = (datetime.utcnow() - timedelta(days=SEARCH_DAYS)).strftime("%d-%b-%Y")
    payments = []
    found_orders = set()

    for folder in FOLDERS_TO_CHECK:
        if not (unpaid_orders - found_orders):
            break
        try:
            status, _ = imap.select(f'"{folder}"', readonly=True)
            if status != "OK":
                continue
            print(f"Searching in {folder!r} since {since_date}...")

            status2, message_ids = imap.search(
                None, f'FROM "{SENDER_FILTER}" SINCE {since_date}'
            )
            if status2 != "OK" or not message_ids[0]:
                continue

            fids = message_ids[0].split()
            print(f"  {len(fids)} bank emails in {folder!r}")

            # Тянем письма пачкой и парсим каждое один раз
            for msg_id in reversed(fids):
                if not (unpaid_orders - found_orders):
                    break
                try:
                    _, data = imap.fetch(msg_id, "(BODY.PEEK[])")
                    if not data or not data[0]:
                        continue

                    msg = email.message_from_bytes(data[0][1])
                    paid_at = _parse_email_date(msg.get("Date", ""))

                    body_html = _get_body(msg, prefer="html")
                    body_text = _get_body(msg, prefer="text")
                    combined = body_text + _html_to_text(body_html)

                    tx_match = re.search(r"ID\s*транзакции[:\s]+(\d+)", combined)
                    transaction_id = tx_match.group(1) if tx_match else None
                    # Без реального ID транзакции письмо не закрывает заявку
                    if not transaction_id:
                        continue

                    # Какой из незакрытых order_id упомянут в этом письме
                    for order_id in (unpaid_orders - found_orders):
                        if re.search(rf"(?<![A-Za-z0-9_]){re.escape(order_id)}(?![A-Za-z0-9_])", combined):
                            print(f"Found: {order_id} tx={transaction_id} folder={folder}")
                            payments.append({"order_id": order_id, "transaction_id": transaction_id, "paid_at": paid_at})
                            found_orders.add(order_id)
                            break

                except Exception as e:
                    print(f"Parse error msg {msg_id} in {folder}: {e}")

        except Exception as e:
            print(f"Folder {folder!r} error: {e}")

    imap.logout()
    print(f"Found: {len(payments)}")

    if not payments:
        return {"ok": True, "matched": 0, "already_paid": 0, "not_found": len(unpaid_orders)}

    conn = psycopg2.connect(dsn)
    matched = 0
    not_found = 0
    try:
        with conn.cursor() as cur:
            for p in payments:
                # Чёрный список: не воскрешаем удалённые вручную заявки/транзакции
                if p["order_id"] in blocked_orders or p["transaction_id"] in blocked_tx:
                    print(f"Skip {p['order_id']}: blocklisted")
                    not_found += 1
                    continue
                # Заморозка месяца: не проставляем оплату в сверённый с бухгалтером период
                pay_month = (p["paid_at"] + timedelta(hours=3)).strftime("%Y-%m") if p.get("paid_at") else None
                if pay_month and pay_month in closed_months:
                    print(f"Skip {p['order_id']}: month {pay_month} is closed")
                    not_found += 1
                    continue
                # Защита: одна банковская транзакция не должна закрывать несколько заявок
                cur.execute(
                    f"SELECT 1 FROM {SCHEMA}.payment_leads WHERE transaction_id = %s LIMIT 1",
                    (p["transaction_id"],)
                )
                if cur.fetchone():
                    print(f"Skip {p['order_id']}: transaction {p['transaction_id']} already used")
                    not_found += 1
                    continue

                cur.execute(
                    f"UPDATE {SCHEMA}.payment_leads SET paid_at = %s, transaction_id = %s "
                    f"WHERE order_id = %s AND paid_at IS NULL",
                    (p["paid_at"], p["transaction_id"], p["order_id"])
                )
                if cur.rowcount > 0:
                    print(f"Marked paid: {p['order_id']}")
                    matched += 1
                else:
                    not_found += 1
        conn.commit()
    finally:
        conn.close()

    return {"ok": True, "matched": matched, "already_paid": 0, "not_found": not_found}


def debug_order_search(order_id: str):
    """Диагностика: ищем письма банка, где упомянут конкретный order_id или его число."""
    mail_password = os.environ["MAIL_PASSWORD"]
    bare_number = re.sub(r"^ORDER_", "", order_id)

    imap = imaplib.IMAP4_SSL(MAIL_HOST)
    imap.login(MAIL_USER, mail_password)

    since_date = (datetime.utcnow() - timedelta(days=SEARCH_DAYS)).strftime("%d-%b-%Y")
    report = {
        "order_id": order_id,
        "bare_number": bare_number,
        "search_days": SEARCH_DAYS,
        "folders": [],
        "hits": [],
    }

    for folder in FOLDERS_TO_CHECK:
        folder_info = {"folder": folder, "selectable": False, "emails": 0}
        try:
            status, _ = imap.select(f'"{folder}"', readonly=True)
            if status != "OK":
                report["folders"].append(folder_info)
                continue
            folder_info["selectable"] = True

            status2, message_ids = imap.search(
                None, f'FROM "{SENDER_FILTER}" SINCE {since_date}'
            )
            if status2 != "OK" or not message_ids[0]:
                report["folders"].append(folder_info)
                continue

            fids = message_ids[0].split()
            folder_info["emails"] = len(fids)
            report["folders"].append(folder_info)

            for msg_id in reversed(fids):
                try:
                    _, data = imap.fetch(msg_id, "(BODY.PEEK[])")
                    if not data or not data[0]:
                        continue
                    msg = email.message_from_bytes(data[0][1])
                    combined = _get_body(msg, prefer="text") + _html_to_text(_get_body(msg, prefer="html"))

                    has_full = bool(re.search(rf"(?<![A-Za-z0-9_]){re.escape(order_id)}(?![A-Za-z0-9_])", combined))
                    has_bare = bool(re.search(rf"(?<!\d){re.escape(bare_number)}(?!\d)", combined))
                    if not (has_full or has_bare):
                        continue

                    tx_match = re.search(r"ID\s*транзакции[:\s]+(\d+)", combined)
                    transaction_id = tx_match.group(1) if tx_match else None

                    idx = combined.find(bare_number)
                    snippet = combined[max(0, idx - 80): idx + 120] if idx >= 0 else combined[:200]

                    report["hits"].append({
                        "folder": folder,
                        "date": msg.get("Date", ""),
                        "subject": _decode_header_str(msg.get("Subject", "")),
                        "matches_full_order_id": has_full,
                        "matches_bare_number": has_bare,
                        "transaction_id_extracted": transaction_id,
                        "snippet": snippet,
                    })
                except Exception as e:
                    print(f"Debug parse error {msg_id} in {folder}: {e}")
        except Exception as e:
            folder_info["error"] = str(e)
            report["folders"].append(folder_info)

    imap.logout()
    return report


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
    try:
        parser = _HTMLTextExtractor()
        parser.feed(html)
        return parser.get_text()
    except Exception:
        return re.sub(r"<[^>]+>", " ", html)


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