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
    name = (raw_name or '').strip()
    if not name:
        return raw_name
    try:
        cached = _load_cached_names()
        entries = []
        for nm in cached:
            nm = (nm or '').strip()
            if nm:
                entries.append({'name': nm, 'words': set(_canon(w) for w in nm.lower().replace('ё', 'е').split())})

        words = [w for w in name.lower().replace('ё', 'е').split() if len(w) >= 2]
        canon = {_canon(w) for w in words}
        surname_roots = {_surname_root(w) for w in words
                         if _canon(w) not in NAME_ALIAS.values() and len(w) >= 4}
        name_words = {w for w in canon if w in NAME_ALIAS.values()}

        best, best_score = None, 0.0
        for e in entries:
            ew = e['words']
            ew_roots = {_surname_root(w) for w in ew}
            common_surname = surname_roots & ew_roots
            common_name = name_words & ew
            if not common_surname:
                continue
            score = 2.0 if common_name else 1.0
            score += len(common_surname) * 0.1 + len(common_name) * 0.1
            if score > best_score:
                best_score, best = score, e
        if best and best_score >= 1:
            return best['name']
    except Exception as e:
        print(f"CRM match failed: {e}")
    return raw_name
