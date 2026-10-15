"""
Автоматическое продвижение лида по воронке «Списка лидов».

Лида ищем по телефону (последние 10 цифр), а если телефона нет — по ФИО
родителя (только если такой лид ровно один). Двигаем только вперёд:
если лид уже дальше по воронке, статус не трогаем. Архив не трогаем.
"""
import re
from typing import Any, Iterable

LEADS = 't_p93118852_lineaschool_initiati.leads'

ST_EMPTY = ''
ST_NO_REPLY = 'Списались в "Окне" (ответ не получен)'
ST_REPLIED = 'Списались в "Окне" (ответ получен)'
ST_FORM = 'Заполнена анкета'
ST_DIAG_UNPAID = 'Запланирована диагностика (не оплачено)'
ST_DIAG_PAID = 'Запланирована диагностика (оплачено)'

BEFORE_BOOKING = (ST_EMPTY, ST_NO_REPLY, ST_REPLIED, ST_FORM)
BEFORE_PAYMENT = BEFORE_BOOKING + (ST_DIAG_UNPAID,)


def _q(v: str) -> str:
    return "'" + str(v).replace("'", "''") + "'"


def _target_sql(phone: Any, name: Any) -> str:
    digits = re.sub(r'\D', '', str(phone or ''))
    if len(digits) >= 10:
        return f"regexp_replace(COALESCE(contact, ''), '\\D', '', 'g') LIKE '%{digits[-10:]}%'"
    nm = ' '.join(str(name or '').split()).lower()
    if len(nm) >= 5:
        norm = "lower(regexp_replace(TRIM(COALESCE({c}, '')), '\\s+', ' ', 'g'))"
        hit = f"({norm.format(c='parent_name')} = {_q(nm)} OR {norm.format(c='student_name')} = {_q(nm)})"
        hit_x = f"({norm.format(c='x.parent_name')} = {_q(nm)} OR {norm.format(c='x.student_name')} = {_q(nm)})"
        return (f"{hit} AND (SELECT count(*) FROM {LEADS} x "
                f"WHERE COALESCE(x.archived, FALSE) = FALSE AND {hit_x}) = 1")
    return ''


def advance_lead(cur, new_status: str, allowed_from: Iterable[str],
                 phone: Any = None, name: Any = None) -> int:
    """Возвращает число обновлённых лидов (0 или 1). Ошибки наружу не бросает."""
    try:
        where = _target_sql(phone, name)
        if not where:
            print(f'lead-funnel: нет телефона и имени для «{new_status}»')
            return 0
        allowed = ', '.join(_q(s) for s in allowed_from)
        cur.execute(
            f"UPDATE {LEADS} SET processing_status = {_q(new_status)}, "
            "status_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP "
            f"WHERE id = (SELECT id FROM {LEADS} WHERE {where} "
            f"AND COALESCE(TRIM(processing_status), '') IN ({allowed}) "
            "AND COALESCE(archived, FALSE) = FALSE ORDER BY id DESC LIMIT 1) RETURNING id"
        )
        row = cur.fetchone()
        n = 1 if row else 0
        if row:
            print(f'lead-funnel: лид {row[0]} → «{new_status}»')
        return n
    except Exception as e:
        print(f'lead-funnel failed: {e}')
        return 0
