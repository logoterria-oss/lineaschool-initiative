"""Сопоставление имени ребёнка с карточкой клиента в AlfaCRM (S20).
Приводит имя к виду, как оно записано в CRM (учитывает уменьшительные формы
и составные карточки вида 'Марк и Сеня Константиновы').
Источник имён — локальный кэш в таблице crm_customers_cache (быстро, без вызова API)."""
import os
import psycopg2

NAME_GROUPS = [
    ["александр", "александра", "саша", "сашка", "шура", "саня"],
    ["алексей", "леша", "лёша", "леха", "алеша"],
    ["анастасия", "настя", "ната", "настенька"],
    ["анна", "аня", "анюта", "нюра"],
    ["артем", "артём", "тема", "тёма"],
    ["богдан", "бодя"],
    ["валерия", "лера", "валера"],
    ["василий", "вася"],
    ["виктория", "вика"],
    ["владислав", "влад", "владик", "слава"],
    ["владимир", "вова", "володя"],
    ["дмитрий", "дима", "митя"],
    ["евгения", "женя"],
    ["евгений", "женя"],
    ["екатерина", "катя", "катюша", "катенька"],
    ["елизавета", "лиза"],
    ["иван", "ваня", "ванечка"],
    ["илья", "илюша"],
    ["константин", "костя"],
    ["ксения", "ксюша", "ксюха"],
    ["леонид", "леня", "лёня"],
    ["мария", "маша", "машенька", "маня"],
    ["марк"],
    ["михаил", "миша", "мишка"],
    ["никита", "ник"],
    ["ольга", "оля"],
    ["павел", "паша", "пашка", "павлик"],
    ["петр", "пётр", "петя", "петенька"],
    ["полина", "поля"],
    ["савелий", "савва", "сава", "савелик"],
    ["семен", "семён", "сема", "сёма", "сеня"],
    ["сергей", "сережа", "серёжа", "серж"],
    ["татьяна", "таня"],
    ["федор", "фёдор", "федя"],
    ["юлия", "юля"],
]


def _build_alias():
    alias = {}
    for group in NAME_GROUPS:
        for form in group:
            alias[form] = group[0]
    return alias


NAME_ALIAS = _build_alias()


def _canon(w: str) -> str:
    w = w.lower().replace('ё', 'е')
    return NAME_ALIAS.get(w, w)


PATRONYMIC_SUF = ('ович', 'евич', 'ьич', 'овна', 'евна', 'ична', 'инична')


def _is_given_name(w: str) -> bool:
    """Имя ли это слово. Кроме словаря уменьшительных ловим имена по
    окончанию: «Матвей», «Тимофей», «Андрей». Без этого «Матвей» считался
    фамилией и оплата привязывалась к чужому однофамильцу."""
    w = _canon(w)
    if w in NAME_ALIAS.values():
        return True
    if w.endswith(PATRONYMIC_SUF):
        return False
    return w.endswith(('ей', 'ий', 'ья', 'ан', 'им')) and len(w) >= 4


def _split_words(words):
    """Делит ФИО на имена и фамилии. Отчество отбрасываем: в заявке на
    оплату родитель его не пишет, а в CRM оно есть — сравнивать нечего.
    Отчество узнаём по суффиксу либо по позиции: слово после имени."""
    names, surnames = set(), set()
    seen_name = False
    for i, w in enumerate(words):
        if len(w) < 2:
            continue
        if _is_given_name(w):
            names.add(_canon(w))
            seen_name = True
            continue
        low = w.lower().replace('ё', 'е')
        # «Ильич» после «Матвей» — отчество, а «Химич» первым словом — фамилия
        if low.endswith(PATRONYMIC_SUF) or (seen_name and i >= 2 and low.endswith('ич')):
            continue
        if len(w) >= 4:
            surnames.add(_surname_root(w))
    return names, surnames


def _surname_root(w: str) -> str:
    w = w.lower().replace('ё', 'е')
    for suf in ('овы', 'евы', 'ова', 'ева', 'ове', 'ову', 'ов', 'ев',
                'ины', 'ина', 'ин', 'ыны', 'ына', 'ын'):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[:-len(suf)]
    return w


def _load_cached_names():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return []
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    cur.execute(f"SELECT name FROM {schema}.crm_customers_cache")
    names = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    return names


def match_name(raw_name: str) -> str:
    """Возвращает имя из CRM-кэша, если нашлось надёжное совпадение, иначе исходное.
    Никогда не бросает исключений — при ошибке возвращает raw_name."""
    found = find_customer(raw_name)
    return found or raw_name


def find_customer(raw_name: str):
    """Ищет карточку в CRM-кэше. Возвращает имя из CRM или None, если
    надёжного совпадения нет — лучше не найти, чем привязать оплату к чужому."""
    name = (raw_name or '').strip()
    if not name:
        return None
    try:
        cached = _load_cached_names()
        entries = []
        for nm in cached:
            nm = (nm or '').strip()
            if not nm:
                continue
            # Порядок слов важен: по нему отличаем отчество от фамилии
            ew_names, ew_roots = _split_words(nm.lower().replace('ё', 'е').split())
            entries.append({'name': nm, 'names': ew_names, 'roots': ew_roots})

        name_words, surname_roots = _split_words(name.lower().replace('ё', 'е').split())

        best, best_score = None, 0.0
        for e in entries:
            ew_roots = e['roots']
            ew_names = e['names']
            common_surname = surname_roots & ew_roots
            common_name = name_words & ew_names
            # Фамилия обязательна: имя «Матвей» есть у десятка учеников,
            # по нему одному карточку выбирать нельзя.
            if not common_surname:
                continue
            # Если у обеих сторон есть распознанные имена, но они не пересекаются —
            # это разные люди (напр. "Павел Беляев" vs "Павел Черепанов"),
            # совпадение только по фамилии-корню недостаточно.
            if name_words and ew_names and not common_name:
                continue
            score = 2.0 if common_name else 1.0
            score += len(common_surname) * 0.1 + len(common_name) * 0.1
            if score > best_score:
                best_score, best = score, e
        if best and best_score >= 1:
            return best['name']
    except Exception as e:
        print(f"CRM match failed: {e}")
    return None