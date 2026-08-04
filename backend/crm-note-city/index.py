'''
Business: Добавляет строку с городом и часовым поясом в примечание лида AlfaCRM.
          Находит лида по телефону родителя, дописывает город В НАЧАЛО note,
          не затирая остальной текст примечания.
Args: event с body {phone, city, region, timezone} — данные из анкеты родителя
Returns: JSON статус обновления примечания в CRM
'''
import json
import os
import re
from typing import Dict, Any, Optional, List
import requests

S20_HOST = 'https://11086.s20.online'


def _norm_phone(raw: Optional[str]) -> str:
    digits = re.sub(r'\D', '', raw or '')
    if len(digits) == 11 and digits[0] == '8':
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits


def _build_city_line(city: str, region: str, timezone: str) -> str:
    '''Собирает строку вида: "г Белгород (Белгородская обл, МСК+0)".'''
    city = (city or '').strip()
    if not city:
        return ''
    inner_parts = [p.strip() for p in (region, timezone) if p and p.strip()]
    inner = ', '.join(inner_parts)
    return f'{city} ({inner})' if inner else city


def _crm_token() -> Optional[str]:
    crm_email = os.environ.get('ALFACRM_EMAIL')
    api_key = os.environ.get('ALFACRM_API_KEY')
    if not crm_email or not api_key:
        print('AlfaCRM credentials not configured')
        return None
    resp = requests.post(
        f'{S20_HOST}/v2api/auth/login',
        json={'email': crm_email, 'api_key': api_key},
        timeout=10,
    )
    if resp.status_code != 200:
        print(f'Auth failed: {resp.status_code} {resp.text[:200]}')
        return None
    return resp.json().get('token')


def _headers(token: str) -> Dict[str, str]:
    return {
        'X-ALFACRM-TOKEN': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }


def _collect_phones(obj, out: set):
    if isinstance(obj, str):
        d = _norm_phone(obj)
        if len(d) == 11:
            out.add(d)
    elif isinstance(obj, dict):
        for v in obj.values():
            _collect_phones(v, out)
    elif isinstance(obj, list):
        for v in obj:
            _collect_phones(v, out)


def _find_customer_by_phone(token: str, branch: str, phone: str) -> Optional[Dict[str, Any]]:
    '''Ищет карточку лида/клиента по телефону родителя.'''
    target = _norm_phone(phone)
    if len(target) != 11:
        return None
    url = f'{S20_HOST}/v2api/{branch}/customer/index'
    # Сначала лиды (is_study=0), затем клиенты (is_study=1)
    for is_study in (0, 1):
        page = 0
        while True:
            payload = {'is_study': is_study, 'removed': 0, 'page': page, 'pageSize': 100}
            resp = requests.post(url, json=payload, headers=_headers(token), timeout=20)
            if resp.status_code != 200:
                break
            data = resp.json()
            items = data.get('items', [])
            for c in items:
                phones = set()
                _collect_phones(c, phones)
                if target in phones:
                    return c
            total = data.get('total', 0)
            page += 1
            if page * 100 >= total or not items:
                break
    return None


def _update_note(token: str, branch: str, customer: Dict[str, Any], city_line: str) -> bool:
    '''Добавляет city_line в начало примечания, не затирая остальной текст.'''
    customer_id = customer.get('id')
    if not customer_id:
        return False

    current_note = (customer.get('note') or '').strip()

    # Если такая строка уже стоит первой — ничего не меняем
    first_line = current_note.split('\n', 1)[0].strip() if current_note else ''
    if first_line == city_line:
        print('City line already present at top — skip')
        return True

    # Убираем прежнюю строку про этот же город, если она где-то есть (защита от дублей)
    lines = [ln for ln in current_note.split('\n')] if current_note else []
    lines = [ln for ln in lines if ln.strip() != city_line]
    new_note = city_line + ('\n' + '\n'.join(lines) if lines else '')

    url = f'{S20_HOST}/v2api/{branch}/customer/update?id={customer_id}'
    payload = {
        'name': customer.get('name'),
        'is_study': customer.get('is_study', 0),
        'legal_type': customer.get('legal_type', 1),
        'branch_ids': customer.get('branch_ids') or [int(branch)],
        'note': new_note,
    }
    if customer.get('legal_name'):
        payload['legal_name'] = customer['legal_name']

    resp = requests.post(url, json=payload, headers=_headers(token), timeout=15)
    if resp.status_code not in (200, 201):
        print(f'Update failed: {resp.status_code} {resp.text[:300]}')
        return False
    result = resp.json()
    if not result.get('success', True):
        print(f'Update returned errors: {result.get("errors")}')
        return False
    print(f'Note updated for customer {customer_id}')
    return True


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}

    phone = body.get('phone') or ''
    city = body.get('city') or ''
    region = body.get('region') or ''
    timezone = body.get('timezone') or ''

    city_line = _build_city_line(city, region, timezone)
    if not city_line:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'updated': False, 'reason': 'no_city'})}
    if _norm_phone(phone) == '' or len(_norm_phone(phone)) != 11:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'updated': False, 'reason': 'no_phone'})}

    branch = os.environ.get('ALFACRM_BRANCH_ID', '1')

    token = _crm_token()
    if not token:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'updated': False, 'reason': 'no_crm'})}

    customer = _find_customer_by_phone(token, branch, phone)
    if not customer:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'updated': False, 'reason': 'not_found'})}

    ok = _update_note(token, branch, customer, city_line)
    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({'updated': ok, 'customerId': customer.get('id'), 'cityLine': city_line}, ensure_ascii=False),
    }
