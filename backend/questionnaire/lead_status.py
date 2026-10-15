"""
Родитель заполнил анкету — двигаем его лида в «Списке лидов» на
«Заполнена анкета». Лида ищем по телефону. Трогаем только лидов, которые
ещё не ушли дальше по воронке (пустой статус или «Списались…»).
"""
import re
from typing import Any

QUESTIONNAIRE_STATUS = 'Заполнена анкета'
EARLY_STATUSES = (
    '',
    'Списались в "Окне" (ответ не получен)',
    'Списались в "Окне" (ответ получен)',
)


def _q(v: str) -> str:
    return "'" + v.replace("'", "''") + "'"


def mark_lead_questionnaire(conn, phone: Any) -> None:
    digits = re.sub(r'\D', '', str(phone or ''))
    if len(digits) < 10:
        print('lead-status: телефона нет, лида не ищем')
        return
    tail = digits[-10:]
    early = ', '.join(_q(s) for s in EARLY_STATUSES)
    cur = conn.cursor()
    cur.execute(
        "UPDATE leads SET "
        f"processing_status = {_q(QUESTIONNAIRE_STATUS)}, "
        "status_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP "
        "WHERE id = (SELECT id FROM leads "
        f"WHERE regexp_replace(COALESCE(contact, ''), '\\D', '', 'g') LIKE '%{tail}%' "
        f"AND COALESCE(TRIM(processing_status), '') IN ({early}) "
        "AND COALESCE(archived, FALSE) = FALSE "
        "ORDER BY id DESC LIMIT 1) RETURNING id"
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    print(f'lead-status: анкета → лид {row[0] if row else "не найден / уже дальше"}')
