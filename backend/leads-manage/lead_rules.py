"""
Правила «Статуса лида» в зависимости от этапа воронки (статуса обработки).

- «Не разобрано»: статуса нет либо «Связь через "Окно" не налажена».
- «Списались в "Окне" (ответ не получен)»: только «Связь через "Окно" не налажена».
- От «ответ получен» до «Утверждено расписание»: по умолчанию «лид в работе»,
  если этап не менялся 3 дня и больше — «завис на этапе».
- «Оплачен абонемент»: «клиент», через 3 дня на этапе — «завис на этапе».
- «Клиент добавлен в мессенджер»: только «клиент».
- «нецелевой лид», «норма развития», «отказ», «игнор» — лид уходит в архив.
Архивных лидов правила не трогают.
"""
from typing import Optional

NO_CONTACT = 'Связь через "Окно" не налажена'
NO_SHOW = 'лид не вышел на связь'
IN_WORK = 'лид в работе'
STUCK = 'завис на этапе'
CLIENT = 'клиент'
CLOSING = ('нецелевой лид', 'норма развития', 'отказ', 'игнор')

NO_REPLY = 'Списались в "Окне" (ответ не получен)'
MID = (
    'Списались в "Окне" (ответ получен)',
    'Заполнена анкета',
    'Запланирована диагностика (не оплачено)',
    'Запланирована диагностика (оплачено)',
    'Проведена диагностика',
    'Утверждено расписание',
)
PAID = 'Оплачен абонемент'
CLIENT_STAGES = (PAID, 'Клиент добавлен в мессенджер')
STUCK_DAYS = 3


def _q(v: str) -> str:
    return "'" + v.replace("'", "''") + "'"


def _in(values) -> str:
    return ', '.join(_q(v) for v in values)


def apply_rules(cur, lead_id: Optional[int] = None) -> None:
    scope = "COALESCE(archived, FALSE) = FALSE AND became_client_at IS NULL AND duplicate_of IS NULL"
    if lead_id:
        scope += f" AND id = {int(lead_id)}"
    ps = "COALESCE(TRIM(processing_status), '')"
    ls = "COALESCE(TRIM(lead_status), '')"
    since = f"COALESCE(status_changed_at, created_at) < NOW() - INTERVAL '{STUCK_DAYS} days'"
    upd = "UPDATE leads SET updated_at = CURRENT_TIMESTAMP, "

    cur.execute(f"{upd}archived = TRUE, archived_at = CURRENT_TIMESTAMP "
                f"WHERE {scope} AND {ps} NOT IN ({_in(CLIENT_STAGES)}) AND {ls} IN ({_in(CLOSING)})")
    cur.execute(f"{upd}lead_status = {_q(CLIENT)} "
                f"WHERE {scope} AND {ps} IN ({_in(CLIENT_STAGES)}) "
                f"AND NOT ({ps} = {_q(PAID)} AND {ls} = {_q(STUCK)} AND {since}) "
                f"AND {ls} <> {_q(CLIENT)}")
    cur.execute(f"{upd}lead_status = {_q(STUCK)} "
                f"WHERE {scope} AND {ps} = {_q(PAID)} AND {ls} = {_q(CLIENT)} AND {since}")
    cur.execute(f"{upd}lead_status = '' "
                f"WHERE {scope} AND {ps} = '' AND {ls} NOT IN ('', {_q(NO_CONTACT)}, {_q(NO_SHOW)})")
    cur.execute(f"{upd}lead_status = {_q(NO_CONTACT)} "
                f"WHERE {scope} AND {ps} = {_q(NO_REPLY)} AND {ls} NOT IN ({_q(NO_CONTACT)}, {_q(NO_SHOW)})")
    cur.execute(f"{upd}lead_status = {_q(IN_WORK)} "
                f"WHERE {scope} AND {ps} IN ({_in(MID)}) "
                f"AND ({ls} NOT IN ({_q(IN_WORK)}, {_q(STUCK)}) OR ({ls} = {_q(STUCK)} AND NOT ({since})))")
    cur.execute(f"{upd}lead_status = {_q(STUCK)} "
                f"WHERE {scope} AND {ps} IN ({_in(MID)}) AND {ls} = {_q(IN_WORK)} AND {since}")
