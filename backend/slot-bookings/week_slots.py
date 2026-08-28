'''Сборка недельного расписания свободных окон для страницы родителя.

Логика повторяет PDF со свободными слотами: родитель называет дату, с которой
готов начать, а мы показываем окна по дням недели — «вот понедельник, вот
вторник». Предлагаем только те окна, которые свободны несколько недель подряд:
на занятия ходят регулярно, и разовое окно родителю не подходит.
'''

from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple

WEEKDAY_NAMES = [
    'Понедельник', 'Вторник', 'Среда', 'Четверг',
    'Пятница', 'Суббота', 'Воскресенье',
]

# Сколько недель подряд окно должно быть свободно, чтобы считать его регулярным
STABLE_WEEKS = 3
# На сколько недель вперёд разрешаем сдвинуть старт, если на первой неделе занято
MAX_START_OFFSET = 1
# Всего недель данных, которые нужно загрузить
WEEKS_TO_LOAD = MAX_START_OFFSET + STABLE_WEEKS
# Дней в запросе к расписанию: одним запросом, иначе не укладываемся в таймаут
DAYS_TO_LOAD = WEEKS_TO_LOAD * 7


def parse_date(raw: Optional[str]) -> date:
    try:
        return datetime.strptime((raw or '')[:10], '%Y-%m-%d').date()
    except Exception:
        return date.today() + timedelta(days=1)


def fmt(d: date) -> str:
    return d.isoformat()


def fmt_ru(d: date) -> str:
    return d.strftime('%d.%m.%Y')


def date_to(start: date) -> date:
    '''Последний день загружаемого периода.'''
    return start + timedelta(days=DAYS_TO_LOAD - 1)


def _offset(start: date, iso: str) -> int:
    '''Сколько дней от даты старта. -1, если дата непонятна.'''
    try:
        d = datetime.strptime(iso[:10], '%Y-%m-%d').date()
    except Exception:
        return -1
    return (d - start).days


# ── Индивидуальные ────────────────────────────────────────────────────────────

def build_individual(
    days: List[dict],
    start: date,
    taken: Set[Tuple[str, str, int]],
) -> List[dict]:
    '''Свободные индивидуальные окна, разложенные по дням недели.

    days — ответ расписания за весь период, taken — окна, уже занятые
    заявками других родителей.
    '''
    # (день от старта, время, педагог) → слот
    index: Dict[Tuple[int, str, int], dict] = {}
    for day in days or []:
        off = _offset(start, day.get('date') or '')
        if off < 0 or off >= DAYS_TO_LOAD:
            continue
        for s in day.get('slots', []):
            index[(off, s.get('time_from') or '', int(s.get('teacher_id') or 0))] = s

    def free_at(off: int, time: str, teacher: int) -> bool:
        s = index.get((off, time, teacher))
        if not s or s.get('busy'):
            return False
        slot_date = start + timedelta(days=off)
        return (fmt(slot_date), time, teacher) not in taken

    # Кандидаты — свободные окна первых недель (день недели + время + педагог)
    candidates: Dict[Tuple[int, str, int], str] = {}
    for (off, time, teacher), s in index.items():
        if off >= (MAX_START_OFFSET + 1) * 7 or s.get('busy'):
            continue
        # Внутри недели день определяется остатком от деления на 7
        candidates.setdefault((off % 7, time, teacher), s.get('time_to') or time)

    by_day: Dict[int, Dict[str, dict]] = {}
    for (day_index, time, teacher), time_to in candidates.items():
        # Ищем первую неделю, с которой окно свободно STABLE_WEEKS подряд
        start_week = -1
        for w in range(MAX_START_OFFSET + 1):
            base = day_index + w * 7
            if all(free_at(base + k * 7, time, teacher) for k in range(STABLE_WEEKS)):
                start_week = w
                break
        if start_week == -1:
            continue

        off = day_index + start_week * 7
        slot = index.get((off, time, teacher)) or {}
        from_date = start + timedelta(days=off) if start_week > 0 else None
        avail = slot.get('available_from')
        if avail:
            try:
                a = datetime.strptime(avail[:10], '%Y-%m-%d').date()
                if not from_date or a > from_date:
                    from_date = a
            except Exception:
                pass

        entry = by_day.setdefault(day_index, {}).setdefault(time, {
            'timeFrom': time,
            'timeTo': time_to,
            'teachers': [],
        })
        entry['teachers'].append({
            'teacherId': teacher,
            'teacherName': slot.get('teacher_name') or '',
            'availableFrom': fmt(from_date) if from_date else None,
        })

    return _to_days(by_day, start, key='slots')


# ── Группы ────────────────────────────────────────────────────────────────────

def build_groups(
    rows: List[dict],
    start: date,
    taken: Set[Tuple[str, str, int]],
    max_size: int = 6,
) -> List[dict]:
    '''Групповые занятия со свободными местами, по дням недели.

    rows — строки таблицы групп: время, педагог и ячейки по дням.
    '''
    # (день от старта, время, педагог) → свободных мест
    free_map: Dict[Tuple[int, str, int], int] = {}
    names: Dict[Tuple[str, int], str] = {}
    for r in rows or []:
        time = r.get('time') or ''
        teacher = int(r.get('teacher_id') or 0)
        names[(time, teacher)] = r.get('teacher_name') or ''
        for cell in (r.get('cells') or {}).values():
            off = _offset(start, cell.get('date') or '')
            if off < 0 or off >= DAYS_TO_LOAD:
                continue
            free_map[(off, time, teacher)] = int(cell.get('free') or 0)

    def stable(day_index: int, week: int, time: str, teacher: int) -> bool:
        base = day_index + week * 7
        first = free_map.get((base, time, teacher))
        if first is None or first <= 0:
            return False
        slot_date = start + timedelta(days=base)
        if (fmt(slot_date), time, teacher) in taken:
            return False
        # Недели, на которые расписание ещё не заведено, стабильность не рушат
        for k in range(1, STABLE_WEEKS):
            later = free_map.get((base + k * 7, time, teacher))
            if later is not None and later <= 0:
                return False
        return True

    # Групповое расписание в CRM заводят заранее и не на каждую неделю, поэтому
    # кандидатов берём со всего периода, а не только с первых недель.
    candidates = {(off % 7, time, teacher) for (off, time, teacher) in free_map}

    by_day: Dict[int, Dict[str, dict]] = {}
    for day_index, time, teacher in candidates:
        start_week = -1
        for w in range(WEEKS_TO_LOAD):
            if stable(day_index, w, time, teacher):
                start_week = w
                break
        if start_week == -1:
            continue

        off = day_index + start_week * 7
        free = free_map.get((off, time, teacher)) or 0
        # Если группа стартует не на первой неделе — пишем родителю дату начала
        from_date = start + timedelta(days=off) if start_week > 0 else None
        if off >= DAYS_TO_LOAD:
            continue

        by_day.setdefault(day_index, {})[f'{time}__{teacher}'] = {
            'timeFrom': time,
            'timeTo': _plus_hour(time),
            'teacherId': teacher,
            'teacherName': names.get((time, teacher), ''),
            'free': free,
            'maxSize': max_size,
            'availableFrom': fmt(from_date) if from_date else None,
        }

    return _to_days(by_day, start, key='groups')


def _plus_hour(time: str) -> str:
    '''Групповое занятие длится час — конец считаем от начала.'''
    try:
        h, m = time[:5].split(':')
        return f'{(int(h) + 1) % 24:02d}:{m}'
    except Exception:
        return time


# ── Общее ─────────────────────────────────────────────────────────────────────

def _to_days(by_day: Dict[int, Dict[str, dict]], start: date, key: str) -> List[dict]:
    '''Раскладываем окна по дням недели, понедельник → воскресенье.'''
    days = []
    for day_index, items in by_day.items():
        if not items:
            continue
        d = start + timedelta(days=day_index)
        days.append({
            'dayOffset': day_index,
            'date': fmt(d),
            'dateRu': fmt_ru(d),
            'weekday': d.weekday(),
            'weekdayName': WEEKDAY_NAMES[d.weekday()],
            key: sorted(items.values(), key=lambda x: x['timeFrom']),
        })
    days.sort(key=lambda x: (x['weekday'], x['dayOffset']))
    return days