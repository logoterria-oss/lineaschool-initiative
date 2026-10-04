"""Банк для финмодели: загрузка выписок 1С (Т-Банк, Локо), синхронизация с T-API, правила разноски операций
по строкам Cash Flow, ручные правки и ручные итоги месяцев до начала банковского факта."""
import os
import re
import json
import base64
import datetime
import urllib.request
import urllib.parse
import urllib.error
import uuid
from decimal import Decimal

import psycopg2
from psycopg2.extras import RealDictCursor, execute_values

S = "t_p93118852_lineaschool_initiati"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}
CATEGORIES = ("revenue", "variable", "fixed", "ano", "one_time", "tax", "interest", "body", "payout",
              "other", "transfer", "ignore", "uncategorized")
TAPI_URL = "https://business.tbank.ru/openapi/api/v1/statement"


def resp(code, payload):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(payload, ensure_ascii=False, default=_ser), "isBase64Encoded": False}


def _ser(v):
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (datetime.date, datetime.datetime)):
        return v.isoformat()
    return str(v)


def msk_today():
    return (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).date()


def auth(cur, event):
    h = event.get("headers") or {}
    token = h.get("X-Auth-Token") or h.get("x-auth-token")
    if not token:
        return None
    cur.execute(
        f"SELECT s.id, s.role FROM {S}.staff_sessions ss JOIN {S}.staff s ON s.id = ss.staff_id "
        "WHERE ss.token = %s AND ss.expires_at > now() AND s.status = 'active'",
        (token,),
    )
    row = cur.fetchone()
    return dict(row) if row and row["role"] == "head" else None


def bank_by_bic(bic):
    return {"044525974": "tbank", "044525161": "loko"}.get(bic or "", "other")


# ---------------- Правила разноски ----------------

def load_rules(cur):
    cur.execute(f"SELECT * FROM {S}.fm_bank_rules WHERE active ORDER BY sort, id")
    return [dict(r) for r in cur.fetchall()]


def match_rule(op, rules):
    for r in rules:
        if r["direction"] != "any" and r["direction"] != op["direction"]:
            continue
        p = r["pattern"].strip()
        if not p:
            continue
        if r["field"] == "inn":
            ok = op["counterparty_inn"] == p
        elif r["field"] == "account":
            ok = op["counterparty_account"] == p
        else:
            hay = op["purpose"] if r["field"] == "purpose" else op["counterparty"]
            ok = p.lower() in (hay or "").lower()
        if ok:
            return r
    return None


def apply_rules(cur, only_uncategorized=False):
    """Разносит операции по правилам. Ручную разноску не трогает."""
    rules = load_rules(cur)
    sql = f"SELECT * FROM {S}.fm_bank_operations WHERE category_source <> 'manual'"
    if only_uncategorized:
        sql += " AND category_source = 'none'"
    cur.execute(sql)
    upd = []
    for op in cur.fetchall():
        r = match_rule(op, rules)
        cat, src, rid = (r["category"], "rule", r["id"]) if r else ("uncategorized", "none", None)
        if (cat, src, rid) != (op["category"], op["category_source"], op["rule_id"]):
            upd.append((op["id"], cat, src, rid))
    if upd:
        execute_values(
            cur,
            f"UPDATE {S}.fm_bank_operations o SET category = v.cat, category_source = v.src, rule_id = v.rid "
            "FROM (VALUES %s) AS v(id, cat, src, rid) WHERE o.id = v.id",
            upd, template="(%s, %s, %s, %s::int)",
        )
    return len(upd)


# ---------------- Выписка 1С ----------------

def _d(s):
    try:
        return datetime.datetime.strptime(s.strip(), "%d.%m.%Y").date()
    except (ValueError, AttributeError):
        return None


def parse_1c(text):
    """Формат 1CClientBankExchange: секции счетов (остатки) и документов."""
    accounts, docs, cur, sec = [], [], None, None
    for raw in text.splitlines():
        line = raw.strip()
        if line == "СекцияРасчСчет":
            sec = {}
            continue
        if line == "КонецРасчСчет":
            accounts.append(sec)
            sec = None
            continue
        if line.startswith("СекцияДокумент="):
            cur = {"Вид": line.split("=", 1)[1]}
            continue
        if line == "КонецДокумента":
            if cur is not None:
                docs.append(cur)
            cur = None
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            if cur is not None:
                cur[k] = v
            elif sec is not None:
                sec[k] = v
    return accounts, docs


def import_1c(cur, conn, body):
    raw = body.get("file") or ""
    if not raw:
        return resp(400, {"error": "Нет файла выписки"})
    data = base64.b64decode(raw.split(",", 1)[-1])
    text = None
    for enc in ("utf-8", "cp1251"):
        try:
            text = data.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if not text or "1CClientBankExchange" not in text[:200]:
        return resp(400, {"error": "Это не выписка в формате 1С (1CClientBankExchange). В интернет-банке выберите формат «1С»."})
    accounts, docs = parse_1c(text)
    own = {a.get("РасчСчет") for a in accounts if a.get("РасчСчет")}
    if not own:
        return resp(400, {"error": "В файле не найден расчётный счёт"})

    cur.execute(f"SELECT account FROM {S}.fm_bank_accounts")
    known = {r["account"] for r in cur.fetchall()}
    for a in own - known:
        bic = next((d.get("ПлательщикБИК") if d.get("ПлательщикСчет") == a else d.get("ПолучательБИК")
                    for d in docs if a in (d.get("ПлательщикСчет"), d.get("ПолучательСчет"))), "")
        cur.execute(f"INSERT INTO {S}.fm_bank_accounts (account, bank, label) VALUES (%s,%s,%s) ON CONFLICT DO NOTHING",
                    (a, bank_by_bic(bic), f"Счёт …{a[-4:]}"))

    rows = []
    for d in docs:
        try:
            amount = round(float((d.get("Сумма") or "0").replace(",", ".")), 2)
        except ValueError:
            continue
        payer, recv = d.get("ПлательщикСчет") or d.get("ПлательщикРасчСчет"), d.get("ПолучательСчет") or d.get("ПолучательРасчСчет")
        if recv in own and d.get("ДатаПоступило"):
            acc, direction, when = recv, "in", _d(d["ДатаПоступило"])
            cp, inn, cp_acc = d.get("Плательщик1") or d.get("Плательщик") or "", d.get("ПлательщикИНН") or "", payer or ""
        elif payer in own and d.get("ДатаСписано"):
            acc, direction, when = payer, "out", _d(d["ДатаСписано"])
            cp, inn, cp_acc = d.get("Получатель1") or d.get("Получатель") or "", d.get("ПолучательИНН") or "", recv or ""
        elif recv in own:
            acc, direction, when = recv, "in", _d(d.get("Дата"))
            cp, inn, cp_acc = d.get("Плательщик1") or "", d.get("ПлательщикИНН") or "", payer or ""
        elif payer in own:
            acc, direction, when = payer, "out", _d(d.get("Дата"))
            cp, inn, cp_acc = d.get("Получатель1") or "", d.get("ПолучательИНН") or "", recv or ""
        else:
            continue
        if not when:
            continue
        number = (d.get("Номер") or "").strip()
        uid = f"{acc}|{direction}|{when.isoformat()}|{number}|{amount:.2f}"
        rows.append((uid, acc, when, _d(d.get("Дата")), number, direction, amount, cp[:300], inn[:20], cp_acc[:30],
                     d.get("НазначениеПлатежа") or "", "file"))

    # Дубли внутри файла (одинаковый номер/сумма/дата) различаем порядковым номером.
    seen, uniq = {}, []
    for r in rows:
        n = seen.get(r[0], 0)
        seen[r[0]] = n + 1
        uniq.append((f"{r[0]}|{n}" if n else r[0], *r[1:]))
    inserted = 0
    if uniq:
        res = execute_values(
            cur,
            f"INSERT INTO {S}.fm_bank_operations (uid, account, op_date, doc_date, doc_number, direction, amount, "
            "counterparty, counterparty_inn, counterparty_account, purpose, source) VALUES %s "
            "ON CONFLICT (uid) DO NOTHING RETURNING id",
            uniq, fetch=True,
        )
        inserted = len(res)

    bal = []
    for a in accounts:
        end, d_end = a.get("КонечныйОстаток"), _d(a.get("ДатаКонца"))
        if a.get("РасчСчет") and end and d_end:
            bal.append((a["РасчСчет"], d_end, round(float(end.replace(",", ".")), 2), "file"))
        beg, d_beg = a.get("НачальныйОстаток"), _d(a.get("ДатаНачала"))
        if a.get("РасчСчет") and beg and d_beg:
            bal.append((a["РасчСчет"], d_beg - datetime.timedelta(days=1), round(float(beg.replace(",", ".")), 2), "file"))
    if bal:
        execute_values(
            cur,
            f"INSERT INTO {S}.fm_bank_balances (account, date, balance_end, source) VALUES %s "
            "ON CONFLICT (account, date) DO UPDATE SET balance_end = EXCLUDED.balance_end, source = EXCLUDED.source",
            bal,
        )
    cur.execute(f"UPDATE {S}.fm_bank_accounts SET last_import_at = now() WHERE account = ANY(%s)", (list(own),))
    apply_rules(cur, only_uncategorized=True)
    conn.commit()
    return resp(200, {"ok": True, "accounts": sorted(own), "total": len(uniq), "inserted": inserted,
                      "skipped": len(uniq) - inserted,
                      "period": [accounts[0].get("ДатаНачала"), accounts[0].get("ДатаКонца")] if accounts else None})


# ---------------- T-API (Т-Бизнес) ----------------

def _tapi_get(token, params):
    url = TAPI_URL + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "X-Request-Id": str(uuid.uuid4()),
                                               "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def sync_tapi(cur, conn, body):
    token = os.environ.get("TBANK_BUSINESS_API_TOKEN")
    if not token:
        return resp(400, {"error": "Не задан токен T-API (секрет TBANK_BUSINESS_API_TOKEN). Загрузите выписку файлом 1С."})
    cur.execute(f"SELECT account FROM {S}.fm_bank_accounts WHERE api AND bank = 'tbank' AND kind = 'business'")
    accs = [r["account"] for r in cur.fetchall()]
    cur.execute(f"SELECT value_text FROM {S}.fm_constants WHERE key = 'bank_fact_from'")
    r = cur.fetchone()
    start = f"{(r or {}).get('value_text') or '2026-10'}-01"
    d_from = body.get("from") or start
    report = []
    for acc in accs:
        try:
            ops, cursor, balances = [], None, None
            for _ in range(20):
                p = {"accountNumber": acc, "from": f"{d_from}T00:00:00Z", "limit": 1000, "operationStatus": "Transaction"}
                if cursor:
                    p["cursor"] = cursor
                else:
                    p["withBalances"] = "true"
                data = _tapi_get(token, p)
                if balances is None:
                    balances = data.get("balances")
                ops += data.get("operations") or []
                cursor = data.get("nextCursor")
                if not cursor:
                    break
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "ignore")[:300]
            hint = " Проверьте токен и разрешённые IP в T-API." if e.code in (401, 403) else ""
            err = f"T-API {e.code}: {msg}{hint}"
            cur.execute(f"UPDATE {S}.fm_bank_accounts SET last_sync_error = %s WHERE account = %s", (err, acc))
            conn.commit()
            report.append({"account": acc, "error": err})
            continue
        except Exception as e:  # сеть / таймаут — фиксируем, не роняем остальные счета
            err = f"Ошибка связи с T-API: {e}"
            cur.execute(f"UPDATE {S}.fm_bank_accounts SET last_sync_error = %s WHERE account = %s", (err, acc))
            conn.commit()
            report.append({"account": acc, "error": err})
            continue

        rows = []
        for o in ops:
            if (o.get("operationStatus") or "Transaction") != "Transaction":
                continue
            direction = "in" if o.get("typeOfOperation") == "Credit" else "out"
            cp = o.get("counterParty") or {}
            when = (o.get("chargeDate") if direction == "in" else o.get("drawDate")) or o.get("operationDate")
            amount = round(float(o.get("accountAmount") or o.get("operationAmount") or 0), 2)
            rows.append((f"api|{o['operationId']}", acc, when[:10], (o.get("docDate") or "")[:10] or None,
                         str(o.get("documentNumber") or "")[:40], direction, amount, (cp.get("name") or "")[:300],
                         (cp.get("inn") or "")[:20], (cp.get("account") or "")[:30],
                         o.get("payPurpose") or o.get("description") or "", "api"))
        # Операция могла прийти раньше файлом: тот же номер документа, дата, сумма и направление — не дублируем.
        fresh = []
        for rw in rows:
            cur.execute(
                f"SELECT 1 FROM {S}.fm_bank_operations WHERE account = %s AND source = 'file' AND op_date = %s "
                "AND direction = %s AND amount = %s AND doc_number = %s LIMIT 1",
                (rw[1], rw[2], rw[5], rw[6], rw[4]),
            )
            if not cur.fetchone():
                fresh.append(rw)
        inserted = 0
        if fresh:
            res = execute_values(
                cur,
                f"INSERT INTO {S}.fm_bank_operations (uid, account, op_date, doc_date, doc_number, direction, amount, "
                "counterparty, counterparty_inn, counterparty_account, purpose, source) VALUES %s "
                "ON CONFLICT (uid) DO NOTHING RETURNING id",
                fresh, fetch=True,
            )
            inserted = len(res)
        bals = [(acc, b["date"], round(float(b["balanceEnd"]), 2), "api")
                for b in ((balances or {}).get("balances") or []) if b.get("date") and b.get("balanceEnd") is not None]
        if bals:
            execute_values(
                cur,
                f"INSERT INTO {S}.fm_bank_balances (account, date, balance_end, source) VALUES %s "
                "ON CONFLICT (account, date) DO UPDATE SET balance_end = EXCLUDED.balance_end, source = EXCLUDED.source",
                bals,
            )
        cur.execute(f"UPDATE {S}.fm_bank_accounts SET last_sync_at = now(), last_sync_error = '' WHERE account = %s", (acc,))
        report.append({"account": acc, "received": len(ops), "inserted": inserted})
    apply_rules(cur, only_uncategorized=True)
    conn.commit()
    return resp(200, {"ok": True, "accounts": report})


# ---------------- Чтение ----------------

def get_bank(cur, params):
    month = params.get("month") or ""
    cur.execute(f"SELECT * FROM {S}.fm_bank_accounts ORDER BY kind, bank")
    accounts = [dict(r) for r in cur.fetchall()]
    cur.execute(
        f"SELECT DISTINCT ON (account) account, date, balance_end, source FROM {S}.fm_bank_balances "
        "ORDER BY account, date DESC"
    )
    last_bal = {r["account"]: dict(r) for r in cur.fetchall()}
    for a in accounts:
        a["last_balance"] = last_bal.get(a["account"])

    cur.execute(
        f"SELECT to_char(op_date, 'YYYY-MM') AS m, count(*) AS n, "
        "sum(CASE WHEN category = 'uncategorized' THEN 1 ELSE 0 END) AS unc FROM "
        f"{S}.fm_bank_operations o JOIN {S}.fm_bank_accounts a USING (account) WHERE a.use_in_cf GROUP BY 1 ORDER BY 1"
    )
    months = [dict(r) for r in cur.fetchall()]
    if not month and months:
        month = months[-1]["m"]
    ops = []
    if month:
        cur.execute(
            f"SELECT o.*, a.bank, r.label AS rule_label FROM {S}.fm_bank_operations o "
            f"JOIN {S}.fm_bank_accounts a USING (account) LEFT JOIN {S}.fm_bank_rules r ON r.id = o.rule_id "
            "WHERE to_char(o.op_date, 'YYYY-MM') = %s ORDER BY o.op_date, o.id",
            (month,),
        )
        ops = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT * FROM {S}.fm_bank_rules ORDER BY sort, id")
    rules = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT * FROM {S}.fm_cashflow_fact_manual ORDER BY month_id, line")
    manual = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT value_text FROM {S}.fm_constants WHERE key = 'bank_fact_from'")
    r = cur.fetchone()
    return resp(200, {"ok": True, "accounts": accounts, "months": months, "month": month, "operations": ops,
                      "rules": rules, "manual": manual, "fact_from": (r or {}).get("value_text") or "2026-10",
                      "tapi_configured": bool(os.environ.get("TBANK_BUSINESS_API_TOKEN")),
                      "today": msk_today().isoformat()})


# ---------------- Правки ----------------

def set_category(cur, conn, body):
    cat = body.get("category")
    if cat not in CATEGORIES:
        return resp(400, {"error": "Неизвестная категория"})
    try:
        oid = int(body.get("id"))
    except (TypeError, ValueError):
        return resp(400, {"error": "Нужен id операции"})
    if cat == "uncategorized" or body.get("reset"):
        cur.execute(f"UPDATE {S}.fm_bank_operations SET category_source = 'none', category = 'uncategorized', rule_id = NULL WHERE id = %s", (oid,))
        apply_rules(cur, only_uncategorized=True)
    else:
        cur.execute(f"UPDATE {S}.fm_bank_operations SET category = %s, category_source = 'manual', rule_id = NULL WHERE id = %s",
                    (cat, oid))
    rule = None
    if body.get("make_rule") and cat not in ("uncategorized",):
        cur.execute(f"SELECT * FROM {S}.fm_bank_operations WHERE id = %s", (oid,))
        op = cur.fetchone()
        if op:
            field, pattern = ("inn", op["counterparty_inn"]) if op["counterparty_inn"] and op["counterparty_inn"] != "0" \
                else ("counterparty", op["counterparty"])
            if body.get("pattern"):
                field, pattern = "purpose", str(body["pattern"])[:300]
            cur.execute(
                f"INSERT INTO {S}.fm_bank_rules (sort, direction, field, pattern, category, label) "
                "VALUES (90, %s, %s, %s, %s, %s) RETURNING id",
                (op["direction"], field, pattern, cat, (op["counterparty"] or pattern)[:200]),
            )
            rule = cur.fetchone()["id"]
            apply_rules(cur)
    conn.commit()
    return resp(200, {"ok": True, "rule_id": rule})


def save_rule(cur, conn, body):
    f = {k: body.get(k) for k in ("direction", "field", "pattern", "category", "label", "sort", "active")}
    if f["category"] not in CATEGORIES or f["field"] not in ("purpose", "counterparty", "inn", "account") \
            or f["direction"] not in ("in", "out", "any") or not (f["pattern"] or "").strip():
        return resp(400, {"error": "Проверьте поля правила"})
    if body.get("id"):
        cur.execute(
            f"UPDATE {S}.fm_bank_rules SET direction=%s, field=%s, pattern=%s, category=%s, label=%s, sort=%s, active=%s WHERE id=%s",
            (f["direction"], f["field"], f["pattern"].strip(), f["category"], f["label"] or "", int(f["sort"] or 100),
             f["active"] is not False, int(body["id"])),
        )
    else:
        cur.execute(
            f"INSERT INTO {S}.fm_bank_rules (direction, field, pattern, category, label, sort) VALUES (%s,%s,%s,%s,%s,%s)",
            (f["direction"], f["field"], f["pattern"].strip(), f["category"], f["label"] or "", int(f["sort"] or 100)),
        )
    n = apply_rules(cur)
    conn.commit()
    return resp(200, {"ok": True, "updated": n})


def delete_rule(cur, conn, body):
    cur.execute(f"DELETE FROM {S}.fm_bank_rules WHERE id = %s", (int(body.get("id") or 0),))
    n = apply_rules(cur)
    conn.commit()
    return resp(200, {"ok": True, "updated": n})


MANUAL_LINES = ("start_balance", "revenue", "variable", "fixed", "ano", "one_time", "tax", "interest", "body",
                "payout", "other", "end_balance")


def set_manual(cur, conn, body):
    month = str(body.get("month") or "")
    if not re.match(r"^\d{4}-\d{2}$", month):
        return resp(400, {"error": "Месяц в формате ГГГГ-ММ"})
    cur.execute(f"SELECT value_text FROM {S}.fm_constants WHERE key = 'bank_fact_from'")
    start = (cur.fetchone() or {}).get("value_text") or "2026-10"
    if month >= start:
        return resp(400, {"error": f"С {start} факт берётся из банка — правьте разноску операций"})
    vals = body.get("values") or {}
    for line, v in vals.items():
        if line not in MANUAL_LINES:
            continue
        if v is None or v == "":
            cur.execute(f"DELETE FROM {S}.fm_cashflow_fact_manual WHERE month_id = %s AND line = %s", (month, line))
        else:
            cur.execute(
                f"INSERT INTO {S}.fm_cashflow_fact_manual (month_id, line, amount, note, updated_at) VALUES (%s,%s,%s,%s,now()) "
                "ON CONFLICT (month_id, line) DO UPDATE SET amount = EXCLUDED.amount, note = EXCLUDED.note, updated_at = now()",
                (month, line, round(float(v), 2), str(body.get("note") or "")[:500]),
            )
    conn.commit()
    return resp(200, {"ok": True})


def handler(event: dict, context) -> dict:
    """Банк в финмодели: GET ?action=bank[&month=YYYY-MM]; POST import_1c (file base64) / sync_tapi / set_category /
    save_rule / delete_rule / reapply / set_manual."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": "", "isBase64Encoded": False}
    conn = psycopg2.connect(os.environ["DATABASE_URL"], connect_timeout=5)
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        if not auth(cur, event):
            return resp(401, {"error": "Доступ только для руководителя"})
        if method == "GET":
            return get_bank(cur, event.get("queryStringParameters") or {})
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            action = body.get("action")
            if action == "import_1c":
                return import_1c(cur, conn, body)
            if action == "sync_tapi":
                return sync_tapi(cur, conn, body)
            if action == "set_category":
                return set_category(cur, conn, body)
            if action == "save_rule":
                return save_rule(cur, conn, body)
            if action == "delete_rule":
                return delete_rule(cur, conn, body)
            if action == "reapply":
                n = apply_rules(cur)
                conn.commit()
                return resp(200, {"ok": True, "updated": n})
            if action == "set_manual":
                return set_manual(cur, conn, body)
            return resp(400, {"error": "Неизвестное действие"})
        return resp(405, {"error": "Метод не поддерживается"})
    finally:
        conn.close()
