"""
Автоматическое скрытие дублей в «Списке лидов».

Дубль — это ещё одна заявка того же ребёнка с тем же телефоном.
На доске оставляем одну карточку: не из архива, дальше всех по воронке,
при равенстве — самую свежую. Остальным ставим duplicate_of, из базы не удаляем.
"""
import re
from typing import Dict, List, Tuple

from name_match import same_child

FUNNEL = [
    '',
    'Списались в "Окне" (ответ не получен)',
    'Списались в "Окне" (ответ получен)',
    'Заполнена анкета',
    'Запланирована диагностика (не оплачено)',
    'Запланирована диагностика (оплачено)',
    'Проведена диагностика',
    'Утверждено расписание',
    'Оплачен абонемент',
    'Клиент добавлен в мессенджер',
]
PHONE_RE = re.compile(r'\+?\d[\d\s()\-]{8,}\d')


def _phone(contact: str) -> str:
    m = PHONE_RE.search(contact or '')
    digits = re.sub(r'\D', '', m.group(0)) if m else ''
    return digits[-10:] if len(digits) >= 10 else ''


def _rank(lead: Tuple) -> Tuple:
    _id, _contact, _child, status, archived = lead
    st = (status or '').strip()
    pos = FUNNEL.index(st) if st in FUNNEL else 0
    return (not archived, pos, _id)


def hide_duplicates(cur) -> List[Tuple[int, int]]:
    cur.execute(
        "SELECT id, contact, student_name, processing_status, COALESCE(archived, FALSE) "
        "FROM leads WHERE became_client_at IS NULL AND duplicate_of IS NULL"
    )
    by_phone: Dict[str, List[Tuple]] = {}
    for row in cur.fetchall():
        ph = _phone(row[1])
        if ph:
            by_phone.setdefault(ph, []).append(row)

    marks: List[Tuple[int, int]] = []
    for group in by_phone.values():
        if len(group) < 2:
            continue
        rest = sorted(group, key=_rank, reverse=True)
        while rest:
            keeper, rest = rest[0], rest[1:]
            twins = [x for x in rest if same_child(keeper[2], x[2])]
            rest = [x for x in rest if x not in twins]
            marks += [(x[0], keeper[0]) for x in twins]

    for dup_id, keeper_id in marks:
        cur.execute(
            f"UPDATE leads SET duplicate_of = {int(keeper_id)}, updated_at = CURRENT_TIMESTAMP "
            f"WHERE id = {int(dup_id)} AND duplicate_of IS NULL"
        )
    if marks:
        print(f'leads-manage: скрыты дубли {marks}')
    return marks
