'''
Business: Добавляет строку с городом и часовым поясом в примечание лида AlfaCRM.
          Находит лида по телефону родителя (а при отсутствии — по ФИО ребёнка/родителя),
          дописывает город В НАЧАЛО note, не затирая остальной текст примечания.
          Если лид найден по ФИО, а телефона из анкеты в карточке нет —
          добавляет этот номер к существующим (не заменяя).
Args: event с body {phone, city, region, timezone, childName, parentName} из анкеты
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


def _name_tokens(raw: Optional[str]) -> set:
    '''Множество значимых слов ФИО в нижнем регистре (для сравнения без учёта порядка).'''
    s = re.sub(r'\s+', ' ', (raw or '').strip().lower())
    return {t for t in s.split(' ') if len(t) >= 2}


def _names_match(anketa_name: str, crm_name: str) -> bool:
    '''ФИО совпадает, если есть минимум два общих слова (имя + фамилия).'''
    a = _name_tokens(anketa_name)
    b = _name_tokens(crm_name)
    if not a or not b:
        return False
    return len(a & b) >= 2


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


def _find_customer_by_name(token: str, branch: str, child_name: str, parent_name: str) -> Optional[Dict[str, Any]]:
    '''Ищет карточку по ФИО ребёнка (name) или родителя (legal_name).

    Совпадение засчитывается, если ФИО ребёнка совпало с name карточки,
    либо ФИО родителя совпало с legal_name карточки.
    '''
    if not (child_name or '').strip() and not (parent_name or '').strip():
        return None
    url = f'{S20_HOST}/v2api/{branch}/customer/index'
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
                crm_child = c.get('name') or ''
                crm_parent = c.get('legal_name') or ''
                if child_name and (_names_match(child_name, crm_child) or _names_match(child_name, crm_parent)):
                    return c
                if parent_name and (_names_match(parent_name, crm_parent) or _names_match(parent_name, crm_child)):
                    return c
            total = data.get('total', 0)
            page += 1
            if page * 100 >= total or not items:
                break
    return None


def _add_phone_to_customer(token: str, branch: str, customer: Dict[str, Any], phone: str) -> bool:
    '''Добавляет номер телефона в карточку, СОХРАНЯЯ существующие номера.'''
    target = _norm_phone(phone)
    if len(target) != 11:
        return False

    existing = set()
    _collect_phones(customer.get('phone'), existing)
    if target in existing:
        return False  # уже есть — добавлять не нужно

    # Собираем итоговый список: исходные значения phone + новый номер
    raw = customer.get('phone')
    if isinstance(raw, list):
        phones_out = [p for p in raw if p]
    elif isinstance(raw, str) and raw.strip():
        phones_out = [raw.strip()]
    else:
        phones_out = []
    phones_out.append(phone)

    customer_id = customer.get('id')
    url = f'{S20_HOST}/v2api/{branch}/customer/update?id={customer_id}'
    payload = {
        'name': customer.get('name'),
        'is_study': customer.get('is_study', 0),
        'legal_type': customer.get('legal_type', 1),
        'branch_ids': customer.get('branch_ids') or [int(branch)],
        'phone': phones_out,
    }
    if customer.get('legal_name'):
        payload['legal_name'] = customer['legal_name']
    if customer.get('note') is not None:
        payload['note'] = customer.get('note')

    resp = requests.post(url, json=payload, headers=_headers(token), timeout=15)
    if resp.status_code not in (200, 201):
        print(f'Add phone failed: {resp.status_code} {resp.text[:300]}')
        return False
    result = resp.json()
    if not result.get('success', True):
        print(f'Add phone returned errors: {result.get("errors")}')
        return False
    print(f'Phone {target} added to customer {customer_id}')
    return True


def _get_customer_by_id(token: str, branch: str, customer_id: int) -> Optional[Dict[str, Any]]:
    '''Карточка клиента по id — для правок из раздела «Ученики».'''
    url = f'{S20_HOST}/v2api/{branch}/customer/index'
    resp = requests.post(url, json={'id': customer_id, 'page': 0, 'pageSize': 1},
                         headers=_headers(token), timeout=15)
    if resp.status_code != 200:
        print(f'Customer fetch failed: {resp.status_code} {resp.text[:200]}')
        return None
    items = resp.json().get('items') or []
    return items[0] if items else None


def _update_note(token: str, branch: str, customer: Dict[str, Any], city_line: str, city: str = '') -> bool:
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

    # Убираем прежние строки о населённом пункте: и точный дубль,
    # и строку с ЛЮБЫМ другим городом (иначе после переезда или правки
    # в примечании копятся оба адреса и непонятно, какой актуален).
    city_norm = (city or '').strip()
    lines = [ln for ln in current_note.split('\n')] if current_note else []

    # «г Пермь (Пермский край, МСК+2)» — населённый пункт с типом
    # и часовым поясом в скобках. Узнаём такую строку по этому шаблону.
    city_pattern = re.compile(
        r'^(г|с|д|п|пгт|рп|ст|х|аул|село|деревня|город|посёлок|поселок)\s+[^(]+'
        r'\(.*мск[+-]?\d*.*\)$',
        re.IGNORECASE,
    )

    def _is_city_line(ln: str) -> bool:
        s = ln.strip()
        if not s:
            return False
        if s == city_line:
            return True
        if city_norm and (s == city_norm or s.startswith(city_norm + ' (')):
            return True
        return bool(city_pattern.match(s))

    lines = [ln for ln in lines if not _is_city_line(ln)]
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
    child_name = body.get('childName') or ''
    parent_name = body.get('parentName') or ''
    customer_id = body.get('customerId')

    city_line = _build_city_line(city, region, timezone)
    if not city_line:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'updated': False, 'reason': 'no_city'})}

    branch_env = os.environ.get('ALFACRM_BRANCH_ID', '1')

    # Правка из раздела «Ученики»: карточка CRM уже известна по id,
    # искать по телефону и ФИО не нужно.
    if customer_id:
        token = _crm_token()
        if not token:
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'updated': False, 'reason': 'no_crm'})}
        customer = _get_customer_by_id(token, branch_env, int(customer_id))
        if not customer:
            return {'statusCode': 200, 'headers': cors,
                    'body': json.dumps({'updated': False, 'reason': 'not_found'})}
        ok = _update_note(token, branch_env, customer, city_line, city)
        return {
            'statusCode': 200,
            'headers': cors,
            'body': json.dumps({
                'updated': ok,
                'matchedBy': 'id',
                'customerId': customer.get('id'),
                'cityLine': city_line,
            }, ensure_ascii=False),
        }

    has_phone = len(_norm_phone(phone)) == 11
    has_name = bool((child_name or '').strip() or (parent_name or '').strip())
    if not has_phone and not has_name:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'updated': False, 'reason': 'no_phone'})}

    branch = branch_env

    token = _crm_token()
    if not token:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'updated': False, 'reason': 'no_crm'})}

    # 1) Ищем по телефону
    customer = _find_customer_by_phone(token, branch, phone) if has_phone else None
    matched_by = 'phone' if customer else None

    # 2) Фолбэк — поиск по ФИО ребёнка/родителя
    phone_added = False
    if not customer and has_name:
        customer = _find_customer_by_name(token, branch, child_name, parent_name)
        if customer:
            matched_by = 'name'
            # ФИО совпало, но телефона из анкеты в карточке нет — добавляем номер
            if has_phone:
                phone_added = _add_phone_to_customer(token, branch, customer, phone)

    if not customer:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'updated': False, 'reason': 'not_found'})}

    ok = _update_note(token, branch, customer, city_line, city)
    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({
            'updated': ok,
            'matchedBy': matched_by,
            'phoneAdded': phone_added,
            'customerId': customer.get('id'),
            'cityLine': city_line,
        }, ensure_ascii=False),
    }