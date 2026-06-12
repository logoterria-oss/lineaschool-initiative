import os
import json
import psycopg2
from datetime import datetime, timedelta

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
}

LONG_TERM_MONTHS = 6


def handler(event: dict, context) -> dict:
    """Отчёт по коэффициенту удержания клиентов.
    Первичное удержание: доля клиентов когорты, купивших второй абонемент позже первого.
    Долгосрочное удержание: доля клиентов, у которых между первой и последней оплатой >= 6 мес.
    Параметры: month (YYYY-MM) ИЛИ from/to (YYYY-MM-DD)."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    date_from = (params.get('from') or '').strip()
    date_to = (params.get('to') or '').strip()
    month = params.get('month', datetime.now().strftime('%Y-%m'))

    use_range = bool(date_from and date_to)
    period_label = f"{date_from} — {date_to}" if use_range else month

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Все оплаченные абонементы (исключаем диагностику) за всю историю — нужны для отслеживания второй покупки
    cur.execute(
        f"SELECT name, plan, amount, paid_at "
        f"FROM {schema}.payment_leads "
        f"WHERE paid_at IS NOT NULL "
        f"ORDER BY paid_at ASC"
    )
    all_rows = cur.fetchall()
    cur.close()
    conn.close()

    # Только абонементы (диагностику не считаем абонементом)
    subs = []
    for name, plan, amount, paid_at in all_rows:
        plan_name = plan or ''
        is_diag = 'диагност' in plan_name.lower() or 'diag' in plan_name.lower()
        if is_diag:
            continue
        if not (name or '').strip():
            continue
        subs.append({'name': name.strip(), 'plan': plan_name, 'amount': float(amount), 'paid_at': paid_at})

    # Кластеризуем платежи по клиентам (нечёткое сравнение ФИО)
    clusters = _cluster_by_name(subs)

    cohort = []          # клиенты, чья ПЕРВАЯ покупка абонемента попала в период
    primary_retained = 0  # купили второй абонемент позже первого
    long_term_retained = 0  # разрыв между первой и последней оплатой >= 6 мес
    rows_out = []

    for cluster in clusters:
        pays = sorted(cluster, key=lambda x: x['paid_at'])
        first = pays[0]
        # Клиент входит в когорту, если его ПЕРВАЯ оплата абонемента попадает в выбранный период
        if not _date_in_period(first['paid_at'], use_range, date_from, date_to, month):
            continue

        cohort.append(cluster)
        client_name = first['name']
        purchases = len(pays)
        last = pays[-1]

        has_second = purchases >= 2
        if has_second:
            primary_retained += 1

        months_span = _months_between(first['paid_at'], last['paid_at'])
        is_long = months_span >= LONG_TERM_MONTHS
        if is_long:
            long_term_retained += 1

        rows_out.append({
            'name': client_name,
            'first_paid_at': first['paid_at'].isoformat() if first['paid_at'] else None,
            'last_paid_at': last['paid_at'].isoformat() if last['paid_at'] else None,
            'purchases': purchases,
            'months_span': round(months_span, 1),
            'primary_retained': has_second,
            'long_term_retained': is_long,
        })

    cohort_size = len(cohort)
    stats = {
        'cohort_size': cohort_size,
        'primary_retained': primary_retained,
        'primary_rate': round(primary_retained / cohort_size * 100, 1) if cohort_size else 0,
        'long_term_retained': long_term_retained,
        'long_term_rate': round(long_term_retained / cohort_size * 100, 1) if cohort_size else 0,
        'long_term_months': LONG_TERM_MONTHS,
    }

    # сортируем: сначала удержанные, потом по количеству покупок
    rows_out.sort(key=lambda r: (-r['purchases'], r['name'].lower()))

    return {
        'statusCode': 200,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps({'stats': stats, 'clients': rows_out, 'period_label': period_label}, ensure_ascii=False),
    }


def _date_in_period(paid_at, use_range, date_from, date_to, month) -> bool:
    # paid_at хранится в UTC; для попадания в период приводим к МСК-дате (+3 часа)
    msk_date = str((paid_at + timedelta(hours=3)).date())
    if use_range:
        return date_from <= msk_date <= date_to
    return msk_date[:7] == month


def _months_between(a, b) -> float:
    """Сколько месяцев прошло между двумя датами (приблизительно, в месяцах)."""
    delta = b - a
    return delta.days / 30.44


# ── Кластеризация клиентов по нечёткому совпадению ФИО ──

def _norm(s: str) -> str:
    return ' '.join(s.lower().replace('ё', 'е').split())


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


def _cluster_by_name(payments: list) -> list:
    """Группирует платежи по клиентам: совпадение ФИО с точностью до опечаток."""
    clusters = []  # список: {'key': norm_name, 'items': [...]}
    for p in payments:
        nm = _norm(p['name'])
        placed = False
        for c in clusters:
            if nm == c['key'] or _names_similar(nm, c['key']):
                c['items'].append(p)
                placed = True
                break
        if not placed:
            clusters.append({'key': nm, 'items': [p]})
    return [c['items'] for c in clusters]