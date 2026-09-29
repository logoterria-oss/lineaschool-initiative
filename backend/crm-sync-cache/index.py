'''
Business: Обновляет локальный кэш клиентов AlfaCRM (таблица crm_customers_cache).
Запускать периодически (например, по расписанию раз в сутки) или вручную.
Args: event с httpMethod
Returns: HTTP-ответ с количеством загруженных клиентов
'''
import os
import re
import json
import psycopg2
import urllib.request
from typing import Dict, Any

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"

# AlfaCRM отдаёт максимум 200 записей на страницу; предел страниц — страховка
# от бесконечного цикла, если API вдруг перестанет отдавать корректный total.
PAGE_SIZE = 200
MAX_PAGES = 50


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    token = _get_token()
    customers = _fetch_customers(token)

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(f"TRUNCATE {schema}.crm_customers_cache")
    saved = 0
    for c in customers:
        cid = c.get('id')
        nm = (c.get('name') or '').strip()
        if cid is None or not nm:
            continue
        safe = nm.replace("'", "''")
        phone = _first_phone(c.get('phone'))
        phone_sql = f"'{phone}'" if phone else 'NULL'
        cur.execute(
            f"INSERT INTO {schema}.crm_customers_cache (id, name, phone, updated_at) "
            f"VALUES ({int(cid)}, '{safe}', {phone_sql}, NOW()) "
            f"ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "
            f"phone = EXCLUDED.phone, updated_at = NOW()"
        )
        saved += 1
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'cached': saved}),
    }


def _first_phone(raw) -> str:
    """Первый телефон карточки в виде 7XXXXXXXXXX.

    AlfaCRM отдаёт список номеров (у карточки их может быть несколько).
    Формат единый — по нему «Окно взаимодействия» находит диалог.
    """
    if isinstance(raw, list):
        raw = raw[0] if raw else ''
    digits = re.sub(r'\D', '', str(raw or ''))
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits if len(digits) == 11 else ''


def _post(url, payload, headers, timeout=20):
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode('utf-8'),
        headers={**headers, 'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))


def _get_token():
    data = _post(f"{S20_HOST}/v2api/auth/login",
                 {"email": S20_EMAIL, "api_key": os.environ["S20_API_KEY"]},
                 {"X-APP-KEY": os.environ["S20_X_APP_KEY"]})
    return data["token"]


def _fetch_customers(token):
    """Все карточки CRM: действующие ученики, лиды и архив.

    Пагинацию считаем ОТДЕЛЬНО по каждой категории. Раньше остаток страниц
    сверялся с общим накопленным списком (`len(items) >= total`), поэтому
    после первой категории счётчик уже перекрывал total следующих — лиды и
    архив обрывались на первой странице, и свежие карточки (например
    новый лид) в кэш не попадали. Отсюда и «нет карточки в CRM» у заявок,
    у которых карточка на самом деле есть.
    """
    headers = {"X-APP-KEY": os.environ["S20_X_APP_KEY"], "X-ALFACRM-TOKEN": token}
    items = []
    seen = set()
    for is_study, removed in ((1, 0), (0, 0), (1, 1), (0, 1)):
        page = 0
        loaded = 0
        while page < MAX_PAGES:
            data = _post(f"{S20_HOST}/v2api/1/customer/index",
                         {"page": page, "pageSize": PAGE_SIZE, "is_study": is_study, "removed": removed},
                         headers)
            chunk = data.get("items", [])
            if not chunk:
                break
            loaded += len(chunk)
            for c in chunk:
                cid = c.get('id')
                if cid is None or cid in seen:
                    continue
                seen.add(cid)
                items.append(c)
            if loaded >= int(data.get("total") or 0) or len(chunk) < PAGE_SIZE:
                break
            page += 1
    print(f'CRM cache: загружено {len(items)} карточек')
    return items