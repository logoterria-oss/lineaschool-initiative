'''
Business: Обновляет локальный кэш клиентов AlfaCRM (таблица crm_customers_cache).
Запускать периодически (например, по расписанию раз в сутки) или вручную.
Args: event с httpMethod
Returns: HTTP-ответ с количеством загруженных клиентов
'''
import os
import json
import psycopg2
import urllib.request
from typing import Dict, Any

S20_HOST = "https://11086.s20.online"
S20_EMAIL = "abram.viktoriya.00@mail.ru"


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
        cur.execute(
            f"INSERT INTO {schema}.crm_customers_cache (id, name, updated_at) "
            f"VALUES ({int(cid)}, '{safe}', NOW()) "
            f"ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()"
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
    headers = {"X-APP-KEY": os.environ["S20_X_APP_KEY"], "X-ALFACRM-TOKEN": token}
    items = []
    for is_study, removed in ((1, 0), (0, 0), (1, 1)):
        page = 0
        while True:
            data = _post(f"{S20_HOST}/v2api/1/customer/index",
                         {"page": page, "pageSize": 200, "is_study": is_study, "removed": removed},
                         headers)
            chunk = data.get("items", [])
            items.extend(chunk)
            if len(items) >= data.get("total", 0) or not chunk:
                break
            page += 1
    return items
