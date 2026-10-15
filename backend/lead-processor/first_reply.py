"""
Лид впервые написал нам в «Окно» (первым или в ответ на приветствие).
Запоминаем когда, где и что написал, и двигаем статус обработки
на «Списались в "Окне" (ответ получен)», если лид ещё не ушёл дальше.
"""
from datetime import datetime
from typing import Any, Dict
import os

import psycopg2

from window_hook import send_contacted

REPLIED_STATUS = 'Списались в "Окне" (ответ получен)'
EARLY_STATUSES = ('', 'Списались в "Окне" (ответ не получен)')


def _q(v: Any) -> str:
    return "'" + str(v).replace("'", "''") + "'"


def _ts(raw: Any) -> str:
    s = str(raw or '').strip()
    if s:
        try:
            datetime.fromisoformat(s.replace('Z', '+00:00'))
            return _q(s) + '::timestamptz'
        except ValueError:
            pass
    return 'CURRENT_TIMESTAMP'


def mark_first_reply(body: Dict[str, Any]) -> Dict[str, Any]:
    try:
        lead_id = int(body.get('leadId') or 0)
    except (TypeError, ValueError):
        lead_id = 0
    if lead_id <= 0:
        return {'status': 400, 'body': {'ok': False, 'error': 'leadId required'}}

    channel = str(body.get('channel') or '')[:50]
    text = str(body.get('text') or '')[:4000]
    after = body.get('afterOurMessage')
    after_sql = 'NULL' if after is None else ('TRUE' if after else 'FALSE')
    early = ', '.join(_q(s) for s in EARLY_STATUSES)

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT id, parent_name, student_name, contact, responsible, "
            f"COALESCE(TRIM(processing_status), '') FROM leads WHERE id = {lead_id}"
        )
        row = cur.fetchone()
        if not row:
            return {'status': 404, 'body': {'ok': False, 'error': 'lead not found'}}
        prev = dict(zip(['id', 'parent_name', 'student_name', 'contact',
                         'responsible', 'processing_status'], row))
        move = prev['processing_status'] in EARLY_STATUSES
        cur.execute(
            "UPDATE leads SET "
            f"first_reply_at = COALESCE(first_reply_at, {_ts(body.get('receivedAt'))}), "
            f"first_reply_channel = COALESCE(first_reply_channel, NULLIF({_q(channel)}, '')), "
            f"first_reply_text = COALESCE(first_reply_text, NULLIF({_q(text)}, '')), "
            f"first_reply_after_our = COALESCE(first_reply_after_our, {after_sql}), "
            f"status_changed_at = CASE WHEN COALESCE(TRIM(processing_status), '') IN ({early}) "
            "THEN CURRENT_TIMESTAMP ELSE status_changed_at END, "
            f"processing_status = CASE WHEN COALESCE(TRIM(processing_status), '') IN ({early}) "
            f"THEN {_q(REPLIED_STATUS)} ELSE processing_status END, "
            f"updated_at = CURRENT_TIMESTAMP WHERE id = {lead_id}"
        )
    finally:
        cur.close()
        conn.close()

    print(f'first-reply: leadId={lead_id} channel={channel!r} moved={move}')
    if move:
        send_contacted(prev, REPLIED_STATUS)
    return {'status': 200, 'body': {'ok': True}}
