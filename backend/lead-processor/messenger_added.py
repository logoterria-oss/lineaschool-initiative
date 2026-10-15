"""
Ответственный добавил клиента в мессенджер. Запоминаем кто и когда,
статус ученика в СРМ и переводим лида на «Клиент добавлен в мессенджер».
"""
from datetime import datetime
from typing import Any, Dict
import os
import re

import psycopg2

DONE_STATUS = 'Клиент добавлен в мессенджер'


def _q(v: Any) -> str:
    return "'" + str(v).replace("'", "''") + "'"


def _txt(v: Any, limit: int = 500) -> str:
    s = str(v or '').strip()[:limit]
    return f"NULLIF({_q(s)}, '')"


def _ts(raw: Any) -> str:
    s = str(raw or '').strip()
    if s:
        try:
            datetime.fromisoformat(s.replace('Z', '+00:00'))
            return _q(s) + '::timestamptz'
        except ValueError:
            pass
    return 'CURRENT_TIMESTAMP'


def _bool(v: Any) -> str:
    if v is None:
        return 'NULL'
    if isinstance(v, str):
        v = v.strip().lower() in ('1', 'true', 'yes', 'да')
    return 'TRUE' if v else 'FALSE'


def mark_messenger_added(body: Dict[str, Any]) -> Dict[str, Any]:
    try:
        lead_id = int(body.get('leadId') or 0)
    except (TypeError, ValueError):
        lead_id = 0
    digits = re.sub(r'\D', '', str(body.get('phone') or ''))
    if lead_id <= 0 and len(digits) < 10:
        return {'status': 400, 'body': {'ok': False, 'error': 'leadId or phone required'}}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()
    try:
        found = None
        if lead_id > 0:
            cur.execute(f"SELECT id FROM leads WHERE id = {lead_id}")
            found = cur.fetchone()
        if not found and len(digits) >= 10:
            cur.execute(
                "SELECT id FROM leads WHERE regexp_replace(COALESCE(contact, ''), '\\D', '', 'g') "
                f"LIKE '%{digits[-10:]}%' ORDER BY COALESCE(archived, FALSE), id DESC LIMIT 1"
            )
            found = cur.fetchone()
        if not found:
            return {'status': 404, 'body': {'ok': False, 'error': 'lead not found'}}
        target = found[0]
        cur.execute(
            "UPDATE leads SET "
            f"messenger_added_at = {_ts(body.get('addedAt'))}, "
            f"messenger_added_by = {_txt(body.get('addedBy'), 200)}, "
            f"messenger_order_id = {_txt(body.get('orderId'), 100)}, "
            f"crm_status = {_txt(body.get('crmStatus'), 100)}, "
            f"crm_label = {_txt(body.get('crmLabel'), 200)}, "
            f"crm_active = {_bool(body.get('active'))}, "
            f"status_changed_at = CASE WHEN processing_status <> {_q(DONE_STATUS)} "
            "THEN CURRENT_TIMESTAMP ELSE status_changed_at END, "
            f"processing_status = {_q(DONE_STATUS)}, "
            f"updated_at = CURRENT_TIMESTAMP WHERE id = {target}"
        )
    finally:
        cur.close()
        conn.close()

    print(f'messenger-added: leadId={target} (asked {lead_id}) by={body.get("addedBy")!r} '
          f'crm={body.get("crmStatus")!r} active={body.get("active")!r}')
    return {'status': 200, 'body': {'ok': True}}
