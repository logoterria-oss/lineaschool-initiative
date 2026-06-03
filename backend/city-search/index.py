"""
Поиск населённых пунктов РФ через Dadata API (база ФИАС). v4
Возвращает список городов, сёл, ПГТ, деревень с часовым поясом МСК±N.
"""

import json
import os
import urllib.request

# Часовые пояса по регионам (смещение от МСК)
# Источник: официальные данные часовых зон РФ
REGION_TIMEZONES = {
    # МСК-1 (UTC+2)
    'калининградская': -1,

    # МСК+0 (UTC+3) — большинство европейской части
    'москва': 0, 'московская': 0, 'санкт-петербург': 0, 'ленинградская': 0,
    'тверская': 0, 'ярославская': 0, 'костромская': 0, 'ивановская': 0,
    'владимирская': 0, 'рязанская': 0, 'тульская': 0, 'калужская': 0,
    'смоленская': 0, 'брянская': 0, 'орловская': 0, 'курская': 0,
    'белгородская': 0, 'воронежская': 0, 'липецкая': 0, 'тамбовская': 0,
    'пензенская': 0, 'мордовия': 0, 'марий эл': 0, 'чувашия': 0,
    'нижегородская': 0, 'казань': 0, 'татарстан': 0, 'ульяновская': 0,
    'саратовская': 0, 'волгоградская': 0, 'астраханская': 0, 'калмыкия': 0,
    'ростовская': 0, 'краснодарский': 0, 'ставропольский': 0,
    'карачаево-черкесская': 0, 'кабардино-балкарская': 0, 'северная осетия': 0,
    'ингушетия': 0, 'чеченская': 0, 'дагестан': 0, 'адыгея': 0,
    'архангельская': 0, 'коми': 0, 'вологодская': 0, 'мурманская': 0,
    'карелия': 0, 'ненецкий': 0, 'новгородская': 0, 'псковская': 0,
    'кировская': 0, 'новосибирская': 0,

    # МСК+1 (UTC+4) — Самара, Уфа, Ижевск, Пермь
    'самарская': 1, 'башкортостан': 1, 'удмуртская': 1, 'пермский': 1,

    # МСК+2 (UTC+5) — Екатеринбург, Челябинск, Тюмень, Курган, ХМАО, ЯНАО
    'свердловская': 2, 'челябинская': 2, 'тюменская': 2, 'курганская': 2,
    'ханты-мансийский': 2, 'ямало-ненецкий': 2, 'оренбургская': 2,

    # МСК+3 (UTC+6) — Омск
    'омская': 3,

    # МСК+4 (UTC+7) — Новосибирск, Томск, Кемерово, Барнаул, Красноярск, Тыва, Хакасия
    'томская': 4, 'кемеровская': 4, 'алтайский': 4, 'алтай': 4,
    'красноярский': 4, 'тыва': 4, 'хакасия': 4,

    # МСК+5 (UTC+8) — Иркутск, Бурятия
    'иркутская': 5, 'бурятия': 5, 'забайкальский': 5,

    # МСК+6 (UTC+9) — Чита (Забайкальский — уже выше), Якутия (западная)
    'якутия': 6, 'саха': 6,

    # МСК+7 (UTC+10) — Хабаровск, Владивосток, Приморье, ЕАО
    'хабаровский': 7, 'приморский': 7, 'еврейская': 7, 'амурская': 7,

    # МСК+8 (UTC+11) — Сахалин, Магадан
    'сахалинская': 8, 'магаданская': 8,

    # МСК+9 (UTC+12) — Камчатка, Чукотка
    'камчатский': 9, 'чукотский': 9,
}


def get_timezone_by_region(region: str) -> int | None:
    region_lower = region.lower()
    for key, offset in REGION_TIMEZONES.items():
        if key in region_lower:
            return offset
    return None


def msk_label(offset: int | None) -> str:
    if offset is None:
        return ''
    if offset == 0:
        return 'МСК+0'
    if offset > 0:
        return f'МСК+{offset}'
    return f'МСК{offset}'


def handler(event: dict, context) -> dict:
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    params = event.get('queryStringParameters') or {}
    query = (params.get('q') or '').strip()

    if not query or len(query) < 2:
        return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps([])}

    api_key = os.environ.get('DADATA_API_KEY', '')
    if not api_key:
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': 'DADATA_API_KEY not configured'})}

    payload = json.dumps({
        'query': query,
        'count': 20,
        'from_bound': {'value': 'city'},
        'to_bound': {'value': 'settlement'},
        'locations': [{'country': 'Россия'}],
        'restrict_value': False,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Token {api_key}',
        }
    )

    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode('utf-8'))

    results = []
    seen = set()
    for item in data.get('suggestions', []):
        d = item.get('data', {})

        settlement = d.get('settlement_with_type') or ''
        city = d.get('city_with_type') or ''
        region = d.get('region_with_type') or ''

        name = settlement or city
        if not name or name in seen:
            continue
        seen.add(name)

        tz_offset = get_timezone_by_region(region)
        tz_label = msk_label(tz_offset)

        label = name
        if region and region.lower() not in name.lower():
            label = f'{name}, {region}'

        results.append({
            'name': name,
            'label': label,
            'timezone': tz_offset,
            'timezone_label': tz_label,
            'region': region,
        })

    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps(results, ensure_ascii=False)
    }
