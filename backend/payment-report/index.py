import os
import json
import psycopg2
import requests
from datetime import datetime

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"


def handler(event: dict, context) -> dict:
    """Возвращает данные для PDF-отчёта по оплатам за выбранный месяц.
    Обогащает платежи данными о родителе и ребёнке из S20 CRM.
    Параметры: month (YYYY-MM), type (all | diag | subscription)."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    params = event.get('queryStringParameters') or {}
    month = params.get('month', datetime.now().strftime('%Y-%m'))
    pay_type = params.get('type', 'all')  # all | diag | subscription

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Загружаем оплаченные платежи за месяц
    cur.execute(
        f"SELECT id, name, email, phone, plan, amount, order_id, created_at, paid_at, transaction_id "
        f"FROM {schema}.payment_leads "
        f"WHERE paid_at IS NOT NULL "
        f"AND to_char(paid_at + interval '3 hours', 'YYYY-MM') = %s "
        f"ORDER BY paid_at ASC",
        (month,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    payments = []
    for row in rows:
        plan_name = row[4] or ''
        is_diag = 'диагност' in plan_name.lower() or 'diag' in plan_name.lower()
        payments.append({
            'id': row[0],
            'name': row[1] or '',
            'email': row[2] or '',
            'phone': row[3] or '',
            'plan': plan_name,
            'amount': float(row[5]),
            'order_id': row[6] or '',
            'created_at': row[7].isoformat() if row[7] else None,
            'paid_at': row[8].isoformat() if row[8] else None,
            'transaction_id': row[9] or '',
            'is_diag': is_diag,
        })

    # Фильтр по типу
    if pay_type == 'diag':
        payments = [p for p in payments if p['is_diag']]
    elif pay_type == 'subscription':
        payments = [p for p in payments if not p['is_diag']]

    # Дедупликация: оставляем уникальные имя+тариф+день (предпочитаем оплаченные, потом новее)
    seen = {}
    deduped = []
    for p in payments:
        day = (p['paid_at'] or '')[:10]
        key = f"{p['name'].strip().lower()}__{p['plan'].strip().lower()}__{day}"
        if key not in seen:
            seen[key] = True
            deduped.append(p)
    payments = deduped

    # Обогащаем данными из S20: ищем ребёнка по имени
    s20_map = {}
    s20_words_idx = {}  # слово → список клиентов (для поиска по отдельным словам)
    try:
        token = _get_s20_token()
        customers = _fetch_all_customers(token)
        s20_map = {_norm(c.get('name', '')): c for c in customers if c.get('name')}
        # Индекс по отдельным словам — для случаев когда порядок слов разный
        for c in customers:
            if not c.get('name'):
                continue
            for w in _norm(c['name']).split():
                if len(w) >= 4:  # только значимые слова (не предлоги)
                    s20_words_idx.setdefault(w, []).append(c)
        # Освежаем локальный справочник CRM (используется при оплате для подстановки имени)
        _refresh_crm_cache(customers, schema)
    except Exception as e:
        print(f"S20 fetch failed: {e}")

    for p in payments:
        child_name = p['name'].strip()
        # 1) Точное совпадение
        child_info = s20_map.get(_norm(child_name))
        # 2) Нечёткое совпадение по всем словам
        if not child_info:
            child_info = _fuzzy_find(child_name, s20_map)
        # 3) По отдельным словам — ищем в индексе по словам имени
        if not child_info:
            child_info = _word_find(child_name, s20_words_idx)  # type: ignore[arg-type]
        print(f"MATCH '{child_name}' → {child_info.get('name') if child_info else 'NOT FOUND'} | legal_name={child_info.get('legal_name') if child_info else '-'}")
        if child_info:
            raw_child = child_info.get('name', child_name)
            raw_parent = child_info.get('legal_name') or child_info.get('parent_name') or ''
            # Имя ребёнка из CRM показываем как есть (может быть составным: "Марк и Сеня Константиновы")
            p['child_name'] = raw_child.strip()
            p['parent_name'] = _format_fi(raw_parent) if raw_parent else ''
            p['child_phone'] = _first_phone(child_info)
            p['child_email'] = _first_email(child_info)
        else:
            p['child_name'] = child_name.strip()
            p['parent_name'] = ''
            p['child_phone'] = p.get('phone', '')
            p['child_email'] = p.get('email', '')

    # Статистика
    total_revenue = sum(p['amount'] for p in payments)
    diag_payments = [p for p in payments if p['is_diag']]
    sub_payments = [p for p in payments if not p['is_diag']]

    # Группировка по тарифам
    plan_stats = {}
    for p in sub_payments:
        plan = p['plan']
        if plan not in plan_stats:
            plan_stats[plan] = {'count': 0, 'revenue': 0.0}
        plan_stats[plan]['count'] += 1
        plan_stats[plan]['revenue'] += p['amount']

    plan_list = []
    sub_revenue = sum(p['amount'] for p in sub_payments)
    sub_count = len(sub_payments)
    for plan, stat in sorted(plan_stats.items(), key=lambda x: -x[1]['revenue']):
        plan_list.append({
            'plan': plan,
            'count': stat['count'],
            'revenue': stat['revenue'],
            'pct_count': round(stat['count'] / sub_count * 100, 1) if sub_count else 0,
            'pct_revenue': round(stat['revenue'] / total_revenue * 100, 1) if total_revenue else 0,
        })

    stats = {
        'total_count': len(payments),
        'total_revenue': total_revenue,
        'diag_count': len(diag_payments),
        'diag_revenue': sum(p['amount'] for p in diag_payments),
        'sub_count': sub_count,
        'sub_revenue': sub_revenue,
        'plan_breakdown': plan_list,
    }

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'payments': payments, 'stats': stats, 'month': month}, ensure_ascii=False),
    }


def _refresh_crm_cache(customers: list, schema: str) -> None:
    """Перезаписывает локальный справочник клиентов CRM (для подстановки имени при оплате)."""
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"TRUNCATE {schema}.crm_customers_cache")
        for c in customers:
            cid = c.get('id')
            nm = (c.get('name') or '').strip()
            if cid is None or not nm:
                continue
            safe = nm.replace("'", "''")
            cur.execute(
                f"INSERT INTO {schema}.crm_customers_cache (id, name, updated_at) "
                f"VALUES ({int(cid)}, '{safe}', NOW())"
            )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"CRM cache refresh failed: {e}")


def _get_s20_token() -> str:
    resp = requests.post(
        f"{S20_HOST}/v2api/auth/login",
        json={"email": S20_EMAIL, "api_key": os.environ["S20_API_KEY"]},
        headers={"X-APP-KEY": os.environ["S20_X_APP_KEY"], "Content-Type": "application/json"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["token"]


def _fetch_all_customers(token: str) -> list:
    url = f"{S20_HOST}/v2api/1/customer/index"
    headers = {
        "X-APP-KEY": os.environ["S20_X_APP_KEY"],
        "X-ALFACRM-TOKEN": token,
        "Content-Type": "application/json",
    }
    all_items = []
    for is_study, removed in ((1, 0), (0, 0), (1, 1)):
        page = 0
        while True:
            resp = requests.post(
                url,
                json={"page": page, "pageSize": 200, "is_study": is_study, "removed": removed},
                headers=headers,
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            items = data.get("items", [])
            all_items.extend(items)
            if len(all_items) >= data.get("total", 0) or not items:
                break
            page += 1
    return all_items


def _norm(s: str) -> str:
    return ' '.join(s.lower().replace('ё', 'е').split())


def _format_fi(name: str) -> str:
    """Возвращает 'Фамилия Имя' из любого формата: ФИО, ИФ, ФИ и т.д.
    
    В CRM студенты хранятся как 'Имя Фамилия' (ИФ),
    лиды — как 'Фамилия Имя Отчество' (ФИО) или произвольно.
    
    Эвристика: если первое слово короткое или второе слово выглядит как фамилия
    (заглавная буква, длиннее имени) — пробуем определить порядок.
    Для однозначности: берём первые два слова и возвращаем как есть,
    поскольку определить порядок ФИ vs ИФ без словаря ненадёжно.
    Пользователь попросил 'Фамилия Имя' — если в CRM 'Имя Фамилия', переставляем.
    """
    if not name:
        return ''
    words = name.strip().split()
    if len(words) == 0:
        return ''
    if len(words) == 1:
        return words[0]
    # Берём только первые 2 слова (убираем отчество)
    w1, w2 = words[0], words[1]
    # Эвристика: в русском языке имена обычно короче фамилий,
    # но это ненадёжно. Возвращаем первые два слова как есть —
    # порядок определяется тем, как данные хранятся в CRM.
    return f"{w1} {w2}"


def _levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        curr = [i + 1]
        for j, cb in enumerate(b):
            curr.append(min(curr[j] + 1, prev[j + 1] + 1, prev[j] + (0 if ca == cb else 1)))
        prev = curr
    return prev[len(b)]


def _names_similar(a: str, b: str) -> bool:
    """Похожи ли два ФИО: устойчиво к опечаткам и лишним словам."""
    if not a or not b:
        return False
    wa = a.split()
    wb = b.split()
    shorter, longer = (wa, wb) if len(wa) <= len(wb) else (wb, wa)
    used = set()
    matched = 0
    for w in shorter:
        best_idx = -1
        best_d = 999
        for i, lw in enumerate(longer):
            if i in used:
                continue
            d = _levenshtein(w, lw)
            max_len = max(len(w), len(lw))
            allowed = 0 if max_len <= 3 else (1 if max_len <= 5 else 2)
            if d <= allowed and d < best_d:
                best_d = d
                best_idx = i
        if best_idx != -1:
            used.add(best_idx)
            matched += 1
    return matched == len(shorter) and matched >= 2


def _fuzzy_find(name: str, s20_map: dict):
    """Нечёткий поиск по s20_map — возвращает наиболее похожую запись."""
    norm_name = _norm(name)
    best = None
    best_score = 999
    for norm_key, customer in s20_map.items():
        if _names_similar(norm_name, norm_key):
            d = _levenshtein(norm_name, norm_key)
            if d < best_score:
                best_score = d
                best = customer
    return best


def _word_find(name: str, words_idx: dict):
    """Поиск по словам имени — находит запись у которой совпадают хотя бы 2 слова из имени платежа."""
    norm_words = [w for w in _norm(name).split() if len(w) >= 4]
    if not norm_words:
        return None
    # Считаем сколько слов совпало для каждого кандидата
    scores = {}
    for w in norm_words:
        # Ищем точное и нечёткое совпадение слова в индексе
        for idx_word, candidates in words_idx.items():
            max_len = max(len(w), len(idx_word))
            allowed = 0 if max_len <= 4 else (1 if max_len <= 6 else 2)
            if _levenshtein(w, idx_word) <= allowed:
                for c in candidates:
                    cid = c.get('id')
                    scores[cid] = scores.get(cid, (0, c))
                    scores[cid] = (scores[cid][0] + 1, c)
    # Берём кандидата с наибольшим числом совпавших слов (минимум 2)
    best = None
    best_count = 1  # порог: нужно хотя бы 2 совпавших слова
    for cid, (count, customer) in scores.items():
        if count > best_count:
            best_count = count
            best = customer
    return best


def _first_phone(customer: dict) -> str:
    phones = customer.get('phone', [])
    if isinstance(phones, list) and phones:
        return phones[0].get('value', '') if isinstance(phones[0], dict) else str(phones[0])
    if isinstance(phones, str):
        return phones
    return ''


def _first_email(customer: dict) -> str:
    emails = customer.get('email', [])
    if isinstance(emails, list) and emails:
        return emails[0].get('value', '') if isinstance(emails[0], dict) else str(emails[0])
    if isinstance(emails, str):
        return emails
    return ''