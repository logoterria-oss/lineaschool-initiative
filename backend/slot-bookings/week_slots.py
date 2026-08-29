'''Сборка недельного расписания свободных окон для страницы родителя.

Логика повторяет PDF со свободными слотами: родитель называет дату, с которой
готов начать, а мы показываем окна по дням недели — «вот понедельник, вот
вторник». Предлагаем только те окна, которые свободны несколько недель подряд:
на занятия ходят регулярно, и разовое окно родителю не подходит.
'''

from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple

from name_match import same_child

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

# Занятие длится 40 минут. В графике работы окна стоят по часу — это слот
# педагога вместе с перерывом, а не длительность урока. Родителю показываем
# реальное время занятия, иначе он ждёт на 20 минут больше.
LESSON_MINUTES = 40


def lesson_end(time_from: str) -> str:
    '''Конец занятия: начало + 40 минут.'''
    try:
        h, m = (time_from or '')[:5].split(':')
        total = int(h) * 60 + int(m) + LESSON_MINUTES
        return f'{(total // 60) % 24:02d}:{total % 60:02d}'
    except Exception:
        return time_from or ''


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


def week_starts(start: date) -> List[date]:
    '''Начала недель периода: старт, старт+7, старт+14, старт+21.

    Групповое расписание отдаётся только понедельно, поэтому запрашиваем
    каждую неделю отдельно.
    '''
    return [start + timedelta(days=7 * w) for w in range(WEEKS_TO_LOAD)]


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
    taken: Set[Tuple[int, str, int]],
) -> List[dict]:
    '''Свободные индивидуальные окна, разложенные по дням недели.

    days — ответ расписания за весь период. taken — окна, уже занятые
    заявками: ключ (день недели, время, педагог), потому что ребёнок ходит
    к педагогу каждую неделю в одно и то же время.
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
        # Занятое окно занято во все недели — сравниваем по дню недели
        weekday = (start + timedelta(days=off)).weekday()
        return (weekday, time, teacher) not in taken

    # Кандидаты — свободные окна первых недель (день недели + время + педагог)
    candidates: Set[Tuple[int, str, int]] = set()
    for (off, time, teacher), s in index.items():
        if off >= (MAX_START_OFFSET + 1) * 7 or s.get('busy'):
            continue
        # Внутри недели день определяется остатком от деления на 7
        candidates.add((off % 7, time, teacher))

    by_day: Dict[int, Dict[str, dict]] = {}
    for day_index, time, teacher in candidates:
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

        # Педагог в отпуске: занятия начнутся с даты выхода. Отпуск перекрывает
        # ВСЕ дни недели, поэтому смотрим дату выхода по всем проверяемым
        # неделям и берём самую позднюю — иначе пометка появлялась только на
        # том дне, который попал в отпуск на первой неделе.
        for k in range(STABLE_WEEKS):
            s = index.get((off + k * 7, time, teacher)) or {}
            avail = s.get('available_from')
            if not avail:
                continue
            try:
                a = datetime.strptime(avail[:10], '%Y-%m-%d').date()
            except Exception:
                continue
            if not from_date or a > from_date:
                from_date = a

        # Окно освободится позже выбранной даты — родителю оно не подходит.
        # Он назвал дату, с которой готов начать, и ждать смысла нет.
        if from_date:
            continue

        entry = by_day.setdefault(day_index, {}).setdefault(time, {
            'timeFrom': time,
            'timeTo': lesson_end(time),
            'teachers': [],
        })
        entry['teachers'].append({
            'teacherId': teacher,
            'teacherName': slot.get('teacher_name') or '',
            'availableFrom': None,
        })

    return _to_days(by_day, start, key='slots')


# ── Группы ────────────────────────────────────────────────────────────────────

# Группы с закреплённой возрастной категорией
AGE_GROUP_RULES = [
    {'weekdays': (1, 3), 'time': '19:00', 'from': 14, 'to': 18},  # ВТ и ЧТ — подростки
    {'weekdays': (4,), 'time': '18:00', 'from': 11, 'to': 15},    # ПТ вечер
]


def age_label(weekday: int, time: str, student_ids, ages) -> str:
    '''Подпись о возрасте группы — как в расписании групп.

    У подростковых групп категория закреплена, у остальных считаем средний
    возраст записанных ребят и берём вилку ±2 года.
    '''
    t = (time or '')[:5]
    for r in AGE_GROUP_RULES:
        if weekday in r['weekdays'] and r['time'] == t:
            return f"рекомендуется для детей от {r['from']} до {r['to']} лет"

    known = [ages[int(s)] for s in (student_ids or []) if int(s) in (ages or {})]
    if not known:
        return ''
    avg = round(sum(known) / len(known))
    return f'рекомендуется для детей от {max(7, avg - 2)} до {avg + 2} лет'


def build_groups(
    weeks: List[List[dict]],
    start: date,
    max_size: int = 6,
    booked: Optional[Dict[Tuple[int, str, int], list]] = None,
    ages: Optional[Dict[int, int]] = None,
    crm_names: Optional[Dict[int, str]] = None,
) -> List[dict]:
    '''Групповые занятия со свободными местами, по дням недели.

    weeks — по списку строк на каждую неделю (расписание отдаёт группы только
    понедельно). Строка: время, педагог и ячейки по дням недели.
    booked — места, занятые нашими заявками: в CRM их ещё нет. Ключ —
    (день недели, время, педагог): ребёнок ходит в группу каждую неделю.
    '''
    booked = booked or {}
    ages = ages or {}
    crm_names = crm_names or {}

    # (день от старта, время, педагог) → свободных мест
    free_map: Dict[Tuple[int, str, int], int] = {}
    students_map: Dict[Tuple[int, str, int], list] = {}
    names: Dict[Tuple[str, int], str] = {}
    for rows in weeks or []:
        for r in rows or []:
            time = r.get('time') or ''
            teacher = int(r.get('teacher_id') or 0)
            names[(time, teacher)] = r.get('teacher_name') or ''
            for cell in (r.get('cells') or {}).values():
                iso_date = cell.get('date') or ''
                off = _offset(start, iso_date)
                if off < 0 or off >= DAYS_TO_LOAD:
                    continue
                # Из свободных мест вычитаем свои заявки — CRM про них не знает.
                # Но только те, чей ребёнок ещё не заведён в эту группу в CRM:
                # иначе одно место списывается дважды.
                weekday = (start + timedelta(days=off)).weekday()
                sids = cell.get('student_ids') or []
                in_crm = [crm_names.get(int(s), '') for s in sids]
                mine = sum(
                    1
                    for child in booked.get((weekday, time, teacher), [])
                    if not any(same_child(child, nm) for nm in in_crm)
                )
                free_map[(off, time, teacher)] = max(0, int(cell.get('free') or 0) - mine)
                students_map[(off, time, teacher)] = sids

    # Групповое расписание в CRM заводят не на все недели вперёд, поэтому
    # кандидатов берём со всего периода, а не только с первых недель.
    candidates = {(off % 7, time, teacher) for (off, time, teacher) in free_map}

    by_day: Dict[int, Dict[str, dict]] = {}
    for day_index, time, teacher in candidates:
        # Все известные недели этого занятия: неделя → свободных мест
        weeks = {
            w: free_map[(day_index + w * 7, time, teacher)]
            for w in range(WEEKS_TO_LOAD)
            if (day_index + w * 7, time, teacher) in free_map
        }
        if not weeks:
            continue

        # Занято, только если мест не осталось. Наши заявки уже вычтены выше,
        # а taken — про индивидуальные окна, к группам он не относится.
        busy = {w: free <= 0 for w, free in weeks.items()}

        # Группа идёт регулярно, поэтому неделя без занятия в CRM — это просто
        # незаполненное расписание, а не отсутствие группы. Пропускаем занятие
        # только если места кончились во ВСЕ известные недели.
        if all(busy.values()):
            continue

        # Первая неделя, где есть места. Если до неё места были заняты, группа
        # откроется позже выбранной даты — такое родителю не предлагаем.
        first_free = min(w for w in weeks if not busy[w])
        if any(w < first_free for w in weeks if busy[w]):
            continue

        weekday = (start + timedelta(days=day_index)).weekday()
        by_day.setdefault(day_index, {})[f'{time}__{teacher}'] = {
            'timeFrom': time,
            'timeTo': lesson_end(time),
            'teacherId': teacher,
            'teacherName': names.get((time, teacher), ''),
            'free': weeks[first_free],
            'maxSize': max_size,
            'availableFrom': None,
            'ageLabel': age_label(
                weekday, time,
                students_map.get((day_index + first_free * 7, time, teacher), []),
                ages,
            ),
        }

    return _to_days(by_day, start, key='groups')


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