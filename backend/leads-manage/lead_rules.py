"""
Правила «Статуса лида» в зависимости от этапа воронки (статуса обработки).

- «Не разобрано»: статуса нет либо «Связь через "Окно" не налажена».
- «Списались в "Окне" (ответ не получен)»: только «Связь через "Окно" не налажена».
- От «ответ получен» до «Утверждено расписание»: по умолчанию «лид в работе»,
  если этап не менялся 3 дня и больше — «завис на этапе».
  На этапах «Запланирована диагностика» «завис» — только если день диагностики прошёл,
  а лид так и не перешёл в «Проведена диагностика».
  На этапах «ответ получен» и «Заполнена анкета» «завис» — уже через 1 день.
- Зависшим от «ответ получен» до «Запланирована диагностика» — этапы дожима:
  «напомнили о себе» → (через 1 день) «уточнили актуальность диагностики» →
  (через 1 день без движения) статус «игнор» и архив.
- «Проведена диагностика»: можно вручную поставить «особые условия» (ждут маткапитал,
  ждут окошки или своя причина) — такой лид не переводится в «завис на этапе».
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
SPECIAL = 'особые условия'
WAIT_SLOTS = 'ожидают окошки'
DIAG_DONE = 'Проведена диагностика'
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
DIAG_PLANNED = (
    'Запланирована диагностика (не оплачено)',
    'Запланирована диагностика (оплачено)',
)
FAST_STUCK = ('Списались в "Окне" (ответ получен)', 'Заполнена анкета')
FAST_STUCK_DAYS = 1
STUCK_FLOW = MID[:4]
REMINDED = 'напомнили о себе'
CHECKED = 'уточнили актуальность диагностики'
IGNORE = 'игнор'
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

    msk_now = "(NOW() AT TIME ZONE 'Europe/Moscow')"
    checked_at = f"(stuck_stage_dates->>{_q(CHECKED)})"
    # Уточнили актуальность, прошёл день, а лид не сдвинулся — «игнор» и в архив
    cur.execute(f"{upd}lead_status = {_q(IGNORE)} "
                f"WHERE {scope} AND {ls} = {_q(STUCK)} AND {ps} IN ({_in(STUCK_FLOW)}) "
                f"AND stuck_stage = {_q(CHECKED)} AND {checked_at} ~ '^\\d{{4}}-\\d{{2}}-\\d{{2}}[T ]\\d{{2}}:\\d{{2}}' "
                f"AND REPLACE({checked_at}, 'T', ' ')::timestamp < {msk_now} - INTERVAL '1 day'")
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
    # Этапы «Запланирована диагностика»: завис, только если день диагностики прошёл, а она не проведена.
    # Без даты диагностики — общее правило 3 дней.
    diag_day = "SUBSTRING(COALESCE(crm_diag_planned_at, '') FROM '^\\d{4}-\\d{2}-\\d{2}')"
    msk_today = "(NOW() AT TIME ZONE 'Europe/Moscow')::date"
    is_diag = f"{ps} IN ({_in(DIAG_PLANNED)})"
    fast_since = f"COALESCE(status_changed_at, created_at) < NOW() - INTERVAL '{FAST_STUCK_DAYS} days'"
    stuck_cond = (f"(CASE WHEN {is_diag} AND {diag_day} IS NOT NULL "
                  f"THEN {diag_day}::date < {msk_today} "
                  f"WHEN {ps} IN ({_in(FAST_STUCK)}) THEN {fast_since} ELSE {since} END)")
    cur.execute(f"{upd}lead_status = {_q(IN_WORK)} "
                f"WHERE {scope} AND {ps} IN ({_in(MID)}) "
                f"AND NOT ({ps} = {_q(DIAG_DONE)} AND {ls} = {_q(SPECIAL)}) "
                f"AND ({ls} NOT IN ({_q(IN_WORK)}, {_q(STUCK)}) OR ({ls} = {_q(STUCK)} AND NOT {stuck_cond}))")
    cur.execute(f"{upd}lead_status = {_q(STUCK)} "
                f"WHERE {scope} AND {ps} IN ({_in(MID)}) AND {ls} = {_q(IN_WORK)} AND {stuck_cond}")
    # Вышел из «завис на этапе» — этапы дожима начинаются заново
    cur.execute(f"{upd}stuck_stage = '', stuck_stage_dates = NULL "
                f"WHERE {scope} AND {ls} <> {_q(STUCK)} AND (stuck_stage <> '' OR stuck_stage_dates IS NOT NULL)")
    # Сняли «особые условия» — причину очищаем
    cur.execute(f"{upd}special_condition = '' "
                f"WHERE {scope} AND {ls} <> {_q(SPECIAL)} AND COALESCE(special_condition, '') <> ''")
    # Окошки нужны только для «ожидают окошки»
    cur.execute(f"{upd}special_slots = NULL "
                f"WHERE {scope} AND special_slots IS NOT NULL "
                f"AND ({ls} <> {_q(SPECIAL)} OR COALESCE(special_condition, '') <> {_q(WAIT_SLOTS)})")
